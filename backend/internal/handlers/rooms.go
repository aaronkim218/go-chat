package handlers

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/utils"
	"go-chat/internal/xcontext"
	"go-chat/internal/xerrors"

	"github.com/aaronkim218/hubsocket"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func (hs *HandlerService) CreateRoom(c *fiber.Ctx) error {
	uid, err := xcontext.GetUserId(c)
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

	if req.Name == "" {
		return xerrors.UnprocessableEntityError(map[string]string{
			"name": "name cannot be empty",
		})
	}

	roomId, err := uuid.NewRandom()
	if err != nil {
		return xerrors.InternalServerError()
	}

	room := models.Room{
		Id:        roomId,
		Host:      uid,
		Name:      req.Name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	result, err := hs.storage.CreateRoom(c.Context(), room, req.Members)
	if err != nil {
		return err
	}

	type response struct {
		Room           models.Room                 `json:"room"`
		MembersResults types.BulkResult[uuid.UUID] `json:"members_results"`
	}

	return c.Status(http.StatusCreated).JSON(response{
		Room:           room,
		MembersResults: result,
	})
}

func (hs *HandlerService) GetMessagesByRoom(c *fiber.Ctx) error {
	uid, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	ridStr := c.Params("roomId")
	if ridStr == "" {
		return xerrors.BadRequestError("room id is required")
	}

	rid, err := uuid.Parse(ridStr)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid room id: %s", ridStr))
	}

	msgs, err := hs.storage.GetUserMessagesByRoomId(c.Context(), rid, uid)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(msgs)
}

func (s *HandlerService) AddUsersToRoom(c *fiber.Ctx) error {
	type request struct {
		UserIds []uuid.UUID `json:"user_ids"`
	}

	ridStr := c.Params("roomId")
	if ridStr == "" {
		return xerrors.BadRequestError("room id is required")
	}

	rid, err := uuid.Parse(ridStr)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid room id: %s", ridStr))
	}

	var req request
	if err := c.BodyParser(&req); err != nil {
		return xerrors.InvalidJSON()
	}

	result, err := s.storage.AddUsersToRoom(c.Context(), req.UserIds, rid)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(result)
}

func (s *HandlerService) GetRoomsByUserId(c *fiber.Ctx) error {
	uid, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	rooms, err := s.storage.GetRoomsByUserId(c.Context(), uid)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(rooms)
}

func (hs *HandlerService) DeleteRoom(c *fiber.Ctx) error {
	uid, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	ridStr := c.Params("roomId")

	rid, err := uuid.Parse(ridStr)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid user id: %s", ridStr))
	}

	if err := hs.storage.DeleteRoomById(c.Context(), rid, uid); err != nil {
		return err
	}

	return c.SendStatus(http.StatusNoContent)
}

func (hs *HandlerService) GetProfilesByRoomId(c *fiber.Ctx) error {
	uid, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	ridStr := c.Params("roomId")

	rid, err := uuid.Parse(ridStr)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid user id: %s", ridStr))
	}

	profiles, err := hs.storage.GetProfilesByRoomId(c.Context(), rid, uid)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profiles)
}

func (hs *HandlerService) JoinRoom(conn *websocket.Conn) {
	defer func() {
		if err := conn.Close(); err != nil {
			hs.logger.Error("Error closing connection", slog.String("err", err.Error()))
		}
	}()

	_, msg, err := conn.ReadMessage()
	if err != nil {
		hs.logger.Error("Expected token but got error reading message", slog.String("err", err.Error()))
		return
	}

	token, err := jwt.Parse(
		string(msg),
		func(t *jwt.Token) (any, error) {
			return []byte(hs.jwtSecret), nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}),
	)
	if err != nil {
		hs.logger.Error("Failed to parse token",
			slog.String("err", err.Error()),
			slog.String("msg", string(msg)),
		)
		return
	}

	uid, err := utils.GetUserIdFromToken(token)
	if err != nil {
		hs.logger.Error("Failed to get user id from token", slog.String("err", err.Error()))
		return
	}

	ridStr := conn.Params("roomId")

	rid, err := uuid.Parse(ridStr)
	if err != nil {
		hs.logger.Error("Invalid room id",
			slog.String("err", err.Error()),
			slog.String("id", ridStr),
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
		exists, existsErr = hs.storage.CheckUserInRoom(context.TODO(), rid, uid)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		profile, profileErr = hs.storage.GetProfileByUserId(context.TODO(), uid)
	}()

	wg.Wait()

	if existsErr != nil {
		hs.logger.Error("Error checking user in room", slog.String("err", existsErr.Error()))
		return
	} else if !exists {
		hs.logger.Error("User in room not found",
			slog.String("userId", uid.String()),
			slog.String("roomId", rid.String()),
		)
		return
	} else if profileErr != nil {
		hs.logger.Error("Error getting profile",
			slog.String("err", profileErr.Error()),
			slog.String("userId", uid.String()),
		)
		return
	}

	client := hubsocket.NewClient(&hubsocket.ClientConfig[models.Profile]{
		Metadata: profile,
		Conn:     conn,
	})

	hs.hub.AddClient(client, rid)

	<-client.Done()
}
