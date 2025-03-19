package handlers

import (
	"fmt"
	"go-chat/internal/models"
	"go-chat/internal/xerrors"
	"net/http"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (s *Service) CreateRoom(c *fiber.Ctx) error {
	type request struct {
		Host    uuid.UUID   `json:"host"`
		Members []uuid.UUID `json:"members"`
	}

	var req request
	if err := c.BodyParser(&req); err != nil {
		return xerrors.InvalidJSON()
	}

	var room models.Room = models.Room{
		Id:   uuid.New(),
		Host: req.Host,
	}

	if err := s.storage.CreateRoom(c.Context(), room, req.Members); err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(room)
}

func (s *Service) GetMessagesByRoom(c *fiber.Ctx) error {
	roomId := c.Params("roomId")
	if roomId == "" {
		return xerrors.BadRequestError("room id is required")
	}

	uuidRoomId, err := uuid.Parse(roomId)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid room id: %s", roomId))
	}

	messages, err := s.storage.GetMessagesByRoomId(c.Context(), uuidRoomId)
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

func (s *Service) JoinRoom(conn *websocket.Conn) {

}
