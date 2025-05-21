package storage

import (
	"context"
	"go-chat/internal/models"

	"github.com/google/uuid"
)

type Storage interface {
	// rooms
	CreateRoom(ctx context.Context, room models.Room, members []uuid.UUID) error
	GetRoomsByUserId(ctx context.Context, userId uuid.UUID) ([]models.Room, error)
	DeleteRoomById(ctx context.Context, roomId uuid.UUID) error

	// messages
	CreateMessage(ctx context.Context, message models.Message) error
	GetMessagesByRoomId(ctx context.Context, roomId uuid.UUID) ([]models.Message, error)

	// users_rooms
	AddUsersToRoom(ctx context.Context, userIds []uuid.UUID, roomId uuid.UUID) error
}
