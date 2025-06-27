package handlers

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"sync"

	"go-chat/internal/hub"
	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/utils"
	"go-chat/internal/xcontext"
	"go-chat/internal/xerrors"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func (hs *HandlerService) CreateRoom(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	type request struct {
		Members []uuid.UUID `json:"members"`
		Name    string      `json:"name"`
	}

	var req request
	if err := c.BodyParser(&req); err != nil {
		return xerrors.InvalidJSON()
	}

	roomId, err := uuid.NewRandom()
	if err != nil {
		return xerrors.InternalServerError()
	}

	room := models.Room{
		Id:   roomId,
		Host: userId,
		Name: req.Name,
	}

	membersResults, err := hs.storage.CreateRoom(c.Context(), room, req.Members)
	if err != nil {
		return err
	}

	type response struct {
		Room           models.Room                 `json:"room"`
		MembersResults types.BulkResult[uuid.UUID] `json:"members_results"`
	}

	return c.Status(http.StatusCreated).JSON(response{
		Room:           room,
		MembersResults: membersResults,
	})
}

func (hs *HandlerService) GetMessagesByRoom(c *fiber.Ctx) error {
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

	userMessages, err := hs.storage.GetUserMessagesByRoomId(c.Context(), uuidRoomId, userId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(userMessages)
}

func (s *HandlerService) AddUsersToRoom(c *fiber.Ctx) error {
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

	bulkResult, err := s.storage.AddUsersToRoom(c.Context(), req.UserIds, uuidRoomId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(bulkResult)
}

func (s *HandlerService) GetRoomsByUserId(c *fiber.Ctx) error {
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

func (hs *HandlerService) DeleteRoom(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	roomId := c.Params("roomId")

	uuidRoomId, err := uuid.Parse(roomId)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid user id: %s", roomId))
	}

	if err := hs.storage.DeleteRoomById(c.Context(), uuidRoomId, userId); err != nil {
		return err
	}

	return c.SendStatus(http.StatusNoContent)
}

func (hs *HandlerService) GetProfilesByRoomId(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	roomId := c.Params("roomId")

	uuidRoomId, err := uuid.Parse(roomId)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid user id: %s", roomId))
	}

	profiles, err := hs.storage.GetProfilesByRoomId(c.Context(), uuidRoomId, userId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profiles)
}

func (hs *HandlerService) JoinRoom(conn *websocket.Conn) {
	defer func() {
		if err := conn.Close(); err != nil {
			hs.logger.Error("error closing connection",
				slog.String("error", err.Error()),
			)
		}
	}()

	_, msg, err := conn.ReadMessage()
	if err != nil {
		hs.logger.Error("expected token but got error reading message",
			slog.String("error", err.Error()),
		)
		return
	}

	token, err := jwt.Parse(
		string(msg),
		func(t *jwt.Token) (interface{}, error) {
			return []byte(hs.jwtSecret), nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}),
	)
	if err != nil {
		hs.logger.Error("failed to parse token",
			slog.String("error", err.Error()),
			slog.String("msg", string(msg)),
		)
		return
	}

	userId, err := utils.GetUserIdFromToken(token)
	if err != nil {
		hs.logger.Error("failed to get user id from token",
			slog.String("error", err.Error()),
		)
		return
	}

	roomId, err := uuid.Parse(conn.Params("roomId"))
	if err != nil {
		hs.logger.Error("invalid room id",
			slog.String("error", err.Error()),
			slog.String("roomId", conn.Params("roomId")),
		)
		return
	}

	var (
		exists     bool
		existsErr  error
		profile    models.Profile
		profileErr error
		wg         sync.WaitGroup
	)

	wg.Add(1)
	go func() {
		defer wg.Done()
		exists, existsErr = hs.storage.CheckUserInRoom(context.TODO(), roomId, userId)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		profile, profileErr = hs.storage.GetProfileByUserId(context.TODO(), userId)
	}()

	wg.Wait()

	if existsErr != nil {
		hs.logger.Error("error checking user in room",
			slog.String("error", existsErr.Error()),
		)
		return
	} else if !exists {
		hs.logger.Error("user in room not found",
			slog.String("userId", userId.String()),
			slog.String("roomId", roomId.String()),
		)
		return
	} else if profileErr != nil {
		hs.logger.Error("error getting profile",
			slog.String("userId", userId.String()),
			slog.String("error", profileErr.Error()),
		)
		return
	}

	ctx, cancel := context.WithCancel(context.TODO())
	hs.hub.AddClient(hub.AddClientRequest{
		RoomId: roomId,
		Client: &types.Client{
			Profile: profile,
			Conn:    conn,
			Ctx:     ctx,
			Cancel:  cancel,
		},
	})

	<-ctx.Done()
	hs.logger.Info(
		"client disconnected",
		slog.String("ip", conn.IP()),
		slog.String("room_id", roomId.String()),
	)
}
