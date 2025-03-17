package handlers

import (
	"fmt"
	"go-chat/internal/models"
	"go-chat/internal/xerrors"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (s *Service) CreateRoom(c *fiber.Ctx) error {
	type request struct {
		Host uuid.UUID `json:"host"`
	}

	var req request
	if err := c.BodyParser(&req); err != nil {
		return xerrors.InvalidJSON()
	}

	var room models.Room = models.Room{
		Id:   uuid.New(),
		Host: req.Host,
	}

	if err := s.storage.CreateRoom(c.Context(), room); err != nil {
		return err
	}

	fmt.Println("here")

	return c.Status(http.StatusOK).JSON(room)
}
