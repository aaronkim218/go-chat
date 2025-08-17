package handlers

import (
	"fmt"
	"net/http"
	"time"

	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/xcontext"
	"go-chat/internal/xerrors"

	"github.com/gofiber/fiber/v2"
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
