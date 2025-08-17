package handlers

import (
	"log/slog"

	"go-chat/internal/plugins"
	"go-chat/internal/storage"

	"github.com/aaronkim218/eventsocket"

	"github.com/gofiber/fiber/v2"
)

type HandlerService struct {
	storage          storage.Storage
	jwtSecret        string
	logger           *slog.Logger
	fiberStorage     fiber.Storage
	eventsocket      *eventsocket.Eventsocket
	pluginsContainer *plugins.Container
}

type HandlerServiceConfig struct {
	Storage          storage.Storage
	JwtSecret        string
	Logger           *slog.Logger
	FiberStorage     fiber.Storage
	Eventsocket      *eventsocket.Eventsocket
	PluginsContainer *plugins.Container
}

func NewService(cfg *HandlerServiceConfig) *HandlerService {
	return &HandlerService{
		storage:          cfg.Storage,
		jwtSecret:        cfg.JwtSecret,
		logger:           cfg.Logger,
		fiberStorage:     cfg.FiberStorage,
		eventsocket:      cfg.Eventsocket,
		pluginsContainer: cfg.PluginsContainer,
	}
}
