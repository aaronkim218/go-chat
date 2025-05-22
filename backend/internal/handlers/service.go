package handlers

import (
	"go-chat/internal/hub"
	"go-chat/internal/storage"
)

type Service struct {
	storage   storage.Storage
	hub       *hub.Hub
	jwtSecret string
}

type ServiceConfig struct {
	Storage   storage.Storage
	Hub       *hub.Hub
	JwtSecret string
}

func NewService(cfg *ServiceConfig) *Service {
	return &Service{
		storage:   cfg.Storage,
		hub:       cfg.Hub,
		jwtSecret: cfg.JwtSecret,
	}
}
