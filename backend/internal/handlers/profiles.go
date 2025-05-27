package handlers

import (
	"go-chat/internal/middleware"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

func (s *Service) GetProfileByUserId(c *fiber.Ctx) error {
	userId, err := middleware.GetUserId(c)
	if err != nil {
		return err
	}

	profile, err := s.storage.GetProfileByUserId(c.Context(), userId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profile)
}
