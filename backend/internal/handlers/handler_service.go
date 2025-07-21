package handlers

import (
	"log/slog"

	"go-chat/internal/hub"
	"go-chat/internal/storage"

	"github.com/gofiber/fiber/v2"
)

type HandlerService struct {
	storage      storage.Storage
	hub          *hub.Hub
	jwtSecret    string
	logger       *slog.Logger
	fiberStorage fiber.Storage
}

type HandlerServiceConfig struct {
	Storage      storage.Storage
	Hub          *hub.Hub
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
