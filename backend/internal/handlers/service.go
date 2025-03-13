package handlers

import "go-chat/internal/storage"

type Service struct {
	storage storage.Storage
}

type ServiceConfig struct {
	Storage storage.Storage
}

func NewService(cfg *ServiceConfig) *Service {
	return &Service{}
}
