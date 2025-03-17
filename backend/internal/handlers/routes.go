package handlers

import (
	"github.com/gofiber/fiber/v2"
)

func (s *Service) RegisterRoutes(app *fiber.App) {
	app.Route("/api", func(api fiber.Router) {
		api.Route("/rooms", func(rooms fiber.Router) {
			rooms.Post("/", s.CreateRoom)
		})
	})
}
