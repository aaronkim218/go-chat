package plugins

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"go-chat/internal/models"
	"go-chat/internal/storage"
	"go-chat/internal/types"

	"github.com/aaronkim218/eventsocket"

	"github.com/google/uuid"
)

type userMessagePayload struct {
	RoomID  string `json:"room_id"`
	Content string `json:"content"`
}

type UserMessagePlugin struct {
	eventsocket    *eventsocket.Eventsocket
	storage        storage.Storage
	logger         *slog.Logger
	clientProfiles map[string]models.Profile
	mu             sync.RWMutex
}

type UserMessagePluginConfig struct {
	Eventsocket *eventsocket.Eventsocket
	Storage     storage.Storage
	Logger      *slog.Logger
}

func NewEventsocketUserMessagePlugin(cfg *UserMessagePluginConfig) *UserMessagePlugin {
	plugin := &UserMessagePlugin{
		eventsocket:    cfg.Eventsocket,
		storage:        cfg.Storage,
		logger:         cfg.Logger,
		clientProfiles: make(map[string]models.Profile),
	}

	plugin.eventsocket.OnRemoveClient("user_message", plugin.unregisterClient)

	return plugin
}

func (um *UserMessagePlugin) RegisterClient(client *eventsocket.Client, profile models.Profile) {
	userID := profile.UserId
	clientID := client.ID()

	um.mu.Lock()
	um.clientProfiles[clientID] = profile
	um.mu.Unlock()

	client.OnMessage("USER_MESSAGE", func(data json.RawMessage) {
		um.handleUserMessage(clientID, userID, data)
	})

	um.logger.Debug("Registered client for user messages",
		slog.String("clientId", clientID),
		slog.String("username", profile.Username),
	)
}

func (um *UserMessagePlugin) unregisterClient(clientID string) {
	um.mu.Lock()
	defer um.mu.Unlock()

	delete(um.clientProfiles, clientID)

	um.logger.Debug("Unregistered client from user messages",
		slog.String("clientId", clientID),
	)
}

func (um *UserMessagePlugin) handleUserMessage(clientID string, userID uuid.UUID, data json.RawMessage) {
	var payload userMessagePayload
	if err := json.Unmarshal(data, &payload); err != nil {
		um.logger.Error("Failed to parse USER_MESSAGE payload",
			slog.String("err", err.Error()),
			slog.String("userId", userID.String()),
		)
		return
	}

	roomID, err := uuid.Parse(payload.RoomID)
	if err != nil {
		um.logger.Error("Invalid roomId format",
			slog.String("err", err.Error()),
			slog.String("roomId", payload.RoomID),
			slog.String("userId", userID.String()),
		)
		return
	}

	messageID, err := uuid.NewRandom()
	if err != nil {
		um.logger.Error("Failed to generate message ID",
			slog.String("err", err.Error()),
			slog.String("userId", userID.String()),
		)
		return
	}

	message := models.Message{
		Id:        messageID,
		RoomId:    roomID,
		Author:    userID,
		Content:   payload.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := um.storage.CreateMessage(context.Background(), message); err != nil {
		um.logger.Error("Failed to create message",
			slog.String("err", err.Error()),
			slog.String("messageId", messageID.String()),
			slog.String("userId", userID.String()),
			slog.String("roomId", payload.RoomID),
		)
		return
	}

	um.mu.RLock()
	profile, exists := um.clientProfiles[clientID]
	um.mu.RUnlock()

	if !exists {
		um.logger.Error("Client profile not found for message broadcast",
			slog.String("clientId", clientID),
			slog.String("userId", userID.String()),
		)
		return
	}

	userMessage := types.UserMessage{
		Message:   message,
		Username:  profile.Username,
		FirstName: profile.FirstName,
		LastName:  profile.LastName,
	}

	if err := um.broadcastUserMessage(payload.RoomID, userMessage); err != nil {
		um.logger.Error("Failed to broadcast user message",
			slog.String("err", err.Error()),
			slog.String("messageId", messageID.String()),
			slog.String("roomId", payload.RoomID),
		)
		return
	}

	um.logger.Info("User message processed successfully",
		slog.String("messageId", messageID.String()),
		slog.String("userId", userID.String()),
		slog.String("roomId", payload.RoomID),
		slog.String("username", profile.Username),
	)
}

func (um *UserMessagePlugin) broadcastUserMessage(roomID string, userMessage types.UserMessage) error {
	payload, err := json.Marshal(userMessage)
	if err != nil {
		return err
	}

	message := eventsocket.Message{
		Type: "USER_MESSAGE",
		Data: payload,
	}

	return um.eventsocket.BroadcastToRoom(roomID, message)
}
