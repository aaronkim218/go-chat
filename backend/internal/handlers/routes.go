package handlers

import (
	"go-chat/internal/middleware"

	jwtware "github.com/gofiber/contrib/jwt"
	"github.com/gofiber/contrib/swagger"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/idempotency"
)

func (s *Service) RegisterRoutes(app *fiber.App) {
	app.Route("/api", func(api fiber.Router) {
		api.Use(swagger.New(swagger.Config{
			BasePath: "/api/",
			FilePath: "./api/swagger.json",
			Path:     "docs",
		}))
		api.Use(jwtware.New(jwtware.Config{
			SigningKey: jwtware.SigningKey{
				JWTAlg: jwtware.HS256,
				Key:    []byte(s.jwtSecret),
			},
		}))
		api.Use(idempotency.New(idempotency.Config{
			Storage: s.fiberStorage,
		}))
		api.Use(middleware.SetUserId())

		api.Route("/rooms", func(rooms fiber.Router) {
			rooms.Get("/", s.GetRoomsByUserId)
			rooms.Post("/", s.CreateRoom)
			rooms.Delete("/:roomId", s.DeleteRoom)
			rooms.Get("/:roomId/messages", s.GetMessagesByRoom)
			rooms.Post("/:roomId/users", s.AddUsersToRoom)
		})

		api.Route("/profiles", func(profiles fiber.Router) {
			profiles.Get("/", s.GetProfileByUserId)
			profiles.Patch("/", s.PatchProfileByUserId)
			profiles.Post("/", s.CreateProfile)
			profiles.Get("/search", s.SearchProfiles)
		})

		api.Route("/messages", func(messages fiber.Router) {
			messages.Delete("/:messageId", s.DeleteMessageById)
		})
	})

	app.Route("/ws", func(ws fiber.Router) {
		ws.Route("/rooms", func(rooms fiber.Router) {
			rooms.Get("/:roomId", websocket.New(s.JoinRoom))
		})
	})
}
