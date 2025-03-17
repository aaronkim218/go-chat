package storage

import (
	"context"
	"go-chat/internal/models"
)

type Storage interface {
	// rooms
	CreateRoom(ctx context.Context, room models.Room) error
}
