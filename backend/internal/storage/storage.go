package storage

import (
	"context"

	"go-chat/internal/models"
	"go-chat/internal/types"

	"github.com/google/uuid"
)

type Storage interface {
	// rooms
	CreateRoom(ctx context.Context, room models.Room, members []uuid.UUID) (types.BulkResult[uuid.UUID], error)
	GetRoomsByUserId(ctx context.Context, userId uuid.UUID) ([]models.Room, error)
	DeleteRoomById(ctx context.Context, roomId uuid.UUID, userId uuid.UUID) error
	GetProfilesByRoomId(ctx context.Context, roomId uuid.UUID, userId uuid.UUID) ([]models.Profile, error)

	// messages
	CreateMessage(ctx context.Context, message models.Message) error
	GetUserMessagesByRoomId(ctx context.Context, roomId uuid.UUID, userId uuid.UUID) ([]types.UserMessage, error)
	DeleteMessageById(ctx context.Context, messageId uuid.UUID, userId uuid.UUID) error

	// users_rooms
	AddUsersToRoom(ctx context.Context, userIds []uuid.UUID, roomId uuid.UUID) (types.BulkResult[uuid.UUID], error)
	CheckUserInRoom(ctx context.Context, roomId uuid.UUID, userId uuid.UUID) (bool, error)

	// profiles
	GetProfileByUserId(ctx context.Context, userId uuid.UUID) (models.Profile, error)
	PatchProfileByUserId(ctx context.Context, partialProfile types.PartialProfile, userId uuid.UUID) error
	CreateProfile(ctx context.Context, profile models.Profile) error
	SearchProfiles(ctx context.Context, options types.SearchProfilesOptions, userId uuid.UUID) ([]models.Profile, error)
}
