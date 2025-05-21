package handlers

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func (s *Service) RegisterRoutes(app *fiber.App) {
	app.Route("/api", func(api fiber.Router) {
		api.Route("/rooms", func(rooms fiber.Router) {
			rooms.Get("/", s.GetRoomsByUserId)
			rooms.Post("/", s.CreateRoom)
			rooms.Delete("/:roomId", s.DeleteRoom)
			rooms.Get("/:roomId/messages", s.GetMessagesByRoom)
			rooms.Post("/:roomId/users", s.AddUsersToRoom)
			rooms.Get("/:roomId/ws", websocket.New(s.JoinRoom))
		})

		api.Route("/messages", func(messages fiber.Router) {
			messages.Post("/", s.CreateMessage)
			messages.Delete("/:messageId", s.DeleteMessageById)
		})
	})
}
