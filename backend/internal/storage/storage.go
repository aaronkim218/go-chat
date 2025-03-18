package storage

import (
	"context"
	"go-chat/internal/models"

	"github.com/google/uuid"
)

type Storage interface {
	// rooms
	CreateRoom(ctx context.Context, room models.Room) error

	// messages
	CreateMessage(ctx context.Context, message models.Message) error
	GetMessagesByRoomId(ctx context.Context, roomId uuid.UUID) ([]models.Message, error)
}
