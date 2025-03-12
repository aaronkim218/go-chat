package server

import (
	"all-chat/internal/settings"
	"all-chat/internal/xerrors"
	"net/http"

	go_json "github.com/goccy/go-json"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type Config struct {
	*settings.Settings
}

func New(cfg *Config) *fiber.App {
	app := createFiberApp()
	setupMiddleware(app)
	setupHealthCheck(app)
	return app
}

func createFiberApp() *fiber.App {
	return fiber.New(fiber.Config{
		JSONEncoder:  go_json.Marshal,
		JSONDecoder:  go_json.Unmarshal,
		ErrorHandler: xerrors.ErrorHandler,
	})
}

func setupMiddleware(app *fiber.App) {
	app.Use(recover.New())
}

func setupHealthCheck(app *fiber.App) {
	app.Get("/healthcheck", func(c *fiber.Ctx) error {
		return c.SendStatus(http.StatusOK)
	})
}
