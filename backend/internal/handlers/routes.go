package handlers

import (
	"go-chat/internal/constants"
	"go-chat/internal/middleware"

	jwtware "github.com/gofiber/contrib/jwt"
	"github.com/gofiber/contrib/swagger"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cache"
	"github.com/gofiber/fiber/v2/middleware/idempotency"
)

func (hs *HandlerService) RegisterRoutes(app *fiber.App) {
	app.Route("/api", func(api fiber.Router) {
		api.Use(swagger.New(swagger.Config{
			BasePath: "/api/",
			FilePath: "./api/swagger.json",
			Path:     "docs",
		}))
		api.Use(jwtware.New(jwtware.Config{
			SigningKey: jwtware.SigningKey{
				JWTAlg: jwtware.HS256,
				Key:    []byte(hs.jwtSecret),
			},
		}))
		api.Use(idempotency.New(idempotency.Config{
			Storage: hs.fiberStorage,
		}))
		api.Use(middleware.SetCacheHeaders())
		api.Use(cache.New(cache.Config{
			KeyGenerator: middleware.CacheKeyGenerator,
			Next:         middleware.SkipCache,
			Storage:      hs.fiberStorage,
			CacheControl: true,
			Expiration:   constants.CacheExpiration,
		}))
		api.Use(middleware.SetUserId())

		api.Route("/rooms", func(rooms fiber.Router) {
			rooms.Get("/", hs.GetRoomsByUserId)
			rooms.Post("/", hs.CreateRoom)
			rooms.Delete("/:roomId", hs.DeleteRoom)
			rooms.Get("/:roomId/messages", hs.GetMessagesByRoom)
			rooms.Post("/:roomId/users", hs.AddUsersToRoom)
			rooms.Get("/:roomId/profiles", hs.GetProfilesByRoomId)
		})

		api.Route("/profiles", func(profiles fiber.Router) {
			profiles.Get("/", hs.GetProfileByUserId)
			profiles.Patch("/", hs.PatchProfileByUserId)
			profiles.Post("/", hs.CreateProfile)
			profiles.Get("/search", hs.SearchProfiles)
		})

		api.Route("/messages", func(messages fiber.Router) {
			messages.Delete("/:messageId", hs.DeleteMessageById)
		})
	})

	app.Route("/ws", func(ws fiber.Router) {
		ws.Route("/rooms", func(rooms fiber.Router) {
			rooms.Get("/:roomId", websocket.New(hs.JoinRoom))
		})
	})
}
