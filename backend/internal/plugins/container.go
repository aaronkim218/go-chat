package plugins

import (
	"log/slog"

	"go-chat/internal/constants"
	"go-chat/internal/eventsocket"
	"go-chat/internal/models"
	"go-chat/internal/storage"
)

type Container struct {
	Presence       *Presence
	RoomManagement *RoomManagement
	UserMessage    *UserMessagePlugin
	TypingStatus   *TypingStatusPlugin
}

type ContainerConfig struct {
	Eventsocket *eventsocket.Eventsocket
	Storage     storage.Storage
	Logger      *slog.Logger
}

func NewContainer(cfg *ContainerConfig) *Container {
	return &Container{
		Presence: NewEventsocketPresencePlugin(&PresenceConfig{
			Eventsocket: cfg.Eventsocket,
			Logger:      cfg.Logger,
		}),
		RoomManagement: NewRoomManagementPlugin(&RoomManagementConfig{
			Eventsocket: cfg.Eventsocket,
			Storage:     cfg.Storage,
			Logger:      cfg.Logger,
		}),
		UserMessage: NewEventsocketUserMessagePlugin(&UserMessagePluginConfig{
			Eventsocket: cfg.Eventsocket,
			Storage:     cfg.Storage,
			Logger:      cfg.Logger,
		}),
		TypingStatus: NewEventsocketTypingStatusPlugin(&TypingStatusPluginConfig{
			Eventsocket:     cfg.Eventsocket,
			Logger:          cfg.Logger,
			Timeout:         constants.TypingStatusTimeout,
			CleanupInterval: constants.TypingStatusCleanupInterval,
		}),
	}
}

func (c *Container) RegisterClient(client *eventsocket.Client, profile models.Profile) {
	c.Presence.RegisterClient(client.ID(), profile)
	c.RoomManagement.RegisterClient(client, profile)
	c.UserMessage.RegisterClient(client, profile)
	c.TypingStatus.RegisterClient(client, profile)
}
