package handlers

import (
	"fmt"
	"go-chat/internal/middleware"
	"go-chat/internal/xerrors"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (s *Service) DeleteMessageById(c *fiber.Ctx) error {
	userId, err := middleware.GetUserId(c)
	if err != nil {
		return err
	}

	messageId := c.Params("messageId")

	uuidMessageId, err := uuid.Parse(messageId)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid user id: %s", messageId))
	}

	if err := s.storage.DeleteMessageById(c.Context(), uuidMessageId, userId); err != nil {
		return err
	}

	return c.SendStatus(http.StatusNoContent)
}
