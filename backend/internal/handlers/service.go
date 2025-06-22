package handlers

import (
	"go-chat/internal/hub"
	"go-chat/internal/storage"
	"log/slog"

	"github.com/gofiber/fiber/v2"
)

type Service struct {
	storage      storage.Storage
	hub          *hub.Hub
	jwtSecret    string
	logger       *slog.Logger
	fiberStorage fiber.Storage
}

type ServiceConfig struct {
	Storage      storage.Storage
	Hub          *hub.Hub
	JwtSecret    string
	Logger       *slog.Logger
	FiberStorage fiber.Storage
}

func NewService(cfg *ServiceConfig) *Service {
	return &Service{
		storage:      cfg.Storage,
		hub:          cfg.Hub,
		jwtSecret:    cfg.JwtSecret,
		logger:       cfg.Logger,
		fiberStorage: cfg.FiberStorage,
	}
}
