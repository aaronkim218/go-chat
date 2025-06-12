package handlers

import (
	"go-chat/internal/hub"
	"go-chat/internal/storage"
	"log/slog"
)

type Service struct {
	storage   storage.Storage
	hub       *hub.Hub
	jwtSecret string
	logger    *slog.Logger
}

type ServiceConfig struct {
	Storage   storage.Storage
	Hub       *hub.Hub
	JwtSecret string
	Logger    *slog.Logger
}

func NewService(cfg *ServiceConfig) *Service {
	return &Service{
		storage:   cfg.Storage,
		hub:       cfg.Hub,
		jwtSecret: cfg.JwtSecret,
		logger:    cfg.Logger,
	}
}
