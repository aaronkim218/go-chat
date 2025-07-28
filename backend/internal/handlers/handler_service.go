package handlers

import (
	"log/slog"

	"go-chat/internal/models"
	"go-chat/internal/storage"

	"github.com/aaronkim218/hubsocket"
	"github.com/gofiber/fiber/v2"
)

type HandlerService struct {
	storage      storage.Storage
	hub          *hubsocket.Hub[models.Profile]
	jwtSecret    string
	logger       *slog.Logger
	fiberStorage fiber.Storage
}

type HandlerServiceConfig struct {
	Storage      storage.Storage
	Hub          *hubsocket.Hub[models.Profile]
	JwtSecret    string
	Logger       *slog.Logger
	FiberStorage fiber.Storage
}

func NewService(cfg *HandlerServiceConfig) *HandlerService {
	return &HandlerService{
		storage:      cfg.Storage,
		hub:          cfg.Hub,
		jwtSecret:    cfg.JwtSecret,
		logger:       cfg.Logger,
		fiberStorage: cfg.FiberStorage,
	}
}
