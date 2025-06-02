package handlers

import (
	"context"
	"fmt"
	"go-chat/internal/hub"
	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/utils"
	"go-chat/internal/xcontext"
	"go-chat/internal/xerrors"
	"log/slog"
	"net/http"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func (s *Service) CreateRoom(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	type request struct {
		Members []uuid.UUID `json:"members"`
	}

	var req request
	if err := c.BodyParser(&req); err != nil {
		return xerrors.InvalidJSON()
	}

	roomId, err := uuid.NewRandom()
	if err != nil {
		return xerrors.InternalServerError()
	}

	var room models.Room = models.Room{
		Id:   roomId,
		Host: userId,
	}

	if err := s.storage.CreateRoom(c.Context(), room, req.Members); err != nil {
		return err
	}

	return c.Status(http.StatusCreated).JSON(room)
}

func (s *Service) GetMessagesByRoom(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	roomId := c.Params("roomId")
	if roomId == "" {
		return xerrors.BadRequestError("room id is required")
	}

	uuidRoomId, err := uuid.Parse(roomId)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid room id: %s", roomId))
	}

	messages, err := s.storage.GetMessagesByRoomId(c.Context(), uuidRoomId, userId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(messages)
}

func (s *Service) AddUsersToRoom(c *fiber.Ctx) error {
	type request struct {
		UserIds []uuid.UUID `json:"user_ids"`
	}

	roomId := c.Params("roomId")
	if roomId == "" {
		return xerrors.BadRequestError("room id is required")
	}

	uuidRoomId, err := uuid.Parse(roomId)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid room id: %s", roomId))
	}

	var req request
	if err := c.BodyParser(&req); err != nil {
		return xerrors.InvalidJSON()
	}

	if err := s.storage.AddUsersToRoom(c.Context(), req.UserIds, uuidRoomId); err != nil {
		return err
	}

	return c.SendStatus(http.StatusCreated)
}

func (s *Service) GetRoomsByUserId(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	rooms, err := s.storage.GetRoomsByUserId(c.Context(), userId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(rooms)
}

func (s *Service) DeleteRoom(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	roomId := c.Params("roomId")

	uuidRoomId, err := uuid.Parse(roomId)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid user id: %s", roomId))
	}

	if err := s.storage.DeleteRoomById(c.Context(), uuidRoomId, userId); err != nil {
		return err
	}

	return c.SendStatus(http.StatusNoContent)
}

func (s *Service) JoinRoom(conn *websocket.Conn) {
	defer conn.Close()

	_, msg, err := conn.ReadMessage()
	if err != nil {
		slog.Error("expected token but got error reading message",
			slog.String("error", err.Error()),
		)
		return
	}

	token, err := jwt.Parse(
		string(msg),
		func(t *jwt.Token) (interface{}, error) {
			return s.jwtSecret, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}),
	)
	if err != nil {
		slog.Error("failed to parse token",
			slog.String("error", err.Error()),
		)
		return
	}

	userId, err := utils.GetUserIdFromToken(token)
	if err != nil {
		slog.Error("failed to get user id from token",
			slog.String("error", err.Error()),
		)
		return
	}

	roomId, err := uuid.Parse(conn.Params("roomId"))
	if err != nil {
		slog.Error("invalid room id",
			slog.String("error", err.Error()),
			slog.String("roomId", conn.Params("roomId")),
		)
		return
	}

	if exists, err := s.storage.CheckUserInRoom(context.TODO(), roomId, userId); !exists {
		slog.Info("user in room not found",
			slog.String("userId", userId.String()),
			slog.String("roomId", roomId.String()),
		)
		return
	} else if err != nil {
		slog.Error("error checking user in room",
			slog.String("error", err.Error()),
		)
		return
	}

	ctx, cancel := context.WithCancel(context.TODO())
	s.hub.AddClient(hub.AddClientRequest{
		RoomId: roomId,
		Client: &types.Client{
			UserId: userId,
			Conn:   conn,
			Ctx:    ctx,
			Cancel: cancel,
		},
	})

	<-ctx.Done()
	slog.Info(
		"client disconnected",
		slog.String("ip", conn.IP()),
		slog.String("room_id", roomId.String()),
	)
}
