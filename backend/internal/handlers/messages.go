package handlers

import (
	"go-chat/internal/models"
	"go-chat/internal/xerrors"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (s *Service) CreateMessage(c *fiber.Ctx) error {
	type request struct {
		RoomId    uuid.UUID `json:"room_id"`
		CreatedAt time.Time `json:"created_at"`
		Author    uuid.UUID `json:"author"`
		Content   string    `json:"content"`
	}

	var req request
	if err := c.BodyParser(&req); err != nil {
		return xerrors.InvalidJSON()
	}

	message := models.Message{
		Id:        uuid.New(),
		RoomId:    req.RoomId,
		CreatedAt: req.CreatedAt,
		Author:    req.Author,
		Content:   req.Content,
	}

	if err := s.storage.CreateMessage(c.Context(), message); err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(message)
}
