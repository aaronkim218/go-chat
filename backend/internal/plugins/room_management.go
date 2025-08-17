package plugins

import (
	"context"
	"encoding/json"
	"log/slog"

	"go-chat/internal/eventsocket"
	"go-chat/internal/models"
	"go-chat/internal/storage"

	"github.com/google/uuid"
)

type joinRoom struct {
	RoomID string `json:"room_id"`
}

type leaveRoom struct {
	RoomID string `json:"room_id"`
}

type RoomManagement struct {
	eventsocket *eventsocket.Eventsocket
	storage     storage.Storage
	logger      *slog.Logger
}

type RoomManagementConfig struct {
	Eventsocket *eventsocket.Eventsocket
	Storage     storage.Storage
	Logger      *slog.Logger
}

func NewRoomManagementPlugin(cfg *RoomManagementConfig) *RoomManagement {
	plugin := &RoomManagement{
		eventsocket: cfg.Eventsocket,
		storage:     cfg.Storage,
		logger:      cfg.Logger,
	}

	return plugin
}

func (rm *RoomManagement) RegisterClient(client *eventsocket.Client, profile models.Profile) {
	userID := profile.UserId

	client.OnMessage("JOIN_ROOM", func(data json.RawMessage) {
		rm.handleJoinRoom(client.ID(), userID, data)
	})

	client.OnMessage("LEAVE_ROOM", func(data json.RawMessage) {
		rm.handleLeaveRoom(client.ID(), userID, data)
	})
}

func (rm *RoomManagement) handleJoinRoom(clientID string, userID uuid.UUID, data json.RawMessage) {
	var payload joinRoom
	if err := json.Unmarshal(data, &payload); err != nil {
		rm.logger.Error("Failed to parse JOIN_ROOM payload",
			slog.String("err", err.Error()),
			slog.String("userId", userID.String()),
		)
		rm.sendJoinRoomError(clientID, "", "Invalid JOIN_ROOM payload")
		return
	}

	roomID, err := uuid.Parse(payload.RoomID)
	if err != nil {
		rm.logger.Error("Invalid room ID in JOIN_ROOM",
			slog.String("err", err.Error()),
			slog.String("userId", userID.String()),
			slog.String("roomId", payload.RoomID),
		)
		rm.sendJoinRoomError(clientID, payload.RoomID, "Invalid room ID")
		return
	}

	authorized, err := rm.storage.CheckUserInRoom(context.Background(), roomID, userID)
	if err != nil {
		rm.logger.Error("Failed to check room authorization",
			slog.String("err", err.Error()),
			slog.String("userId", userID.String()),
			slog.String("roomId", payload.RoomID),
		)
		rm.sendJoinRoomError(clientID, payload.RoomID, "Failed to check room authorization")
		return
	}

	if !authorized {
		rm.logger.Warn("User not authorized for room",
			slog.String("userId", userID.String()),
			slog.String("roomId", payload.RoomID),
		)
		rm.sendJoinRoomError(clientID, payload.RoomID, "Not authorized for this room")
		return
	}

	if err := rm.eventsocket.AddClientToRoom(payload.RoomID, clientID); err != nil {
		rm.logger.Error("Failed to add client to room",
			slog.String("err", err.Error()),
			slog.String("userId", userID.String()),
			slog.String("roomId", payload.RoomID),
		)
		rm.sendJoinRoomError(clientID, payload.RoomID, "Failed to join room")
		return
	}

	rm.sendJoinRoomSuccess(clientID, payload.RoomID)

	rm.logger.Info("User joined room",
		slog.String("userId", userID.String()),
		slog.String("roomId", payload.RoomID),
	)
}

func (rm *RoomManagement) handleLeaveRoom(clientID string, userID uuid.UUID, data json.RawMessage) {
	var payload leaveRoom
	if err := json.Unmarshal(data, &payload); err != nil {
		rm.logger.Error("Failed to parse LEAVE_ROOM payload",
			slog.String("err", err.Error()),
			slog.String("userId", userID.String()),
		)
		return
	}

	rm.eventsocket.RemoveClientFromRoom(payload.RoomID, clientID)

	rm.logger.Info("User left room",
		slog.String("userId", userID.String()),
		slog.String("roomId", payload.RoomID),
	)
}

func (rm *RoomManagement) sendJoinRoomSuccess(clientID, roomID string) {
	responseData, _ := json.Marshal(struct {
		RoomID string `json:"room_id"`
	}{
		RoomID: roomID,
	})

	message := eventsocket.Message{
		Type: "JOIN_ROOM_SUCCESS",
		Data: responseData,
	}

	if err := rm.eventsocket.BroadcastToClient(clientID, message); err != nil {
		rm.logger.Error("Failed to send JOIN_ROOM_SUCCESS",
			slog.String("err", err.Error()),
			slog.String("roomId", roomID),
			slog.String("clientId", clientID),
		)
		return
	}

	rm.logger.Debug("Sent JOIN_ROOM_SUCCESS", slog.String("roomId", roomID), slog.String("clientId", clientID))
}

func (rm *RoomManagement) sendJoinRoomError(clientID, roomID, errorMessage string) {
	payloadData := struct {
		RoomID  string `json:"room_id"`
		Message string `json:"message"`
	}{
		RoomID:  roomID,
		Message: errorMessage,
	}

	responseData, _ := json.Marshal(payloadData)

	message := eventsocket.Message{
		Type: "JOIN_ROOM_ERROR",
		Data: responseData,
	}

	if err := rm.eventsocket.BroadcastToClient(clientID, message); err != nil {
		rm.logger.Error("Failed to send JOIN_ROOM_ERROR",
			slog.String("err", err.Error()),
			slog.String("roomId", roomID),
			slog.String("message", errorMessage),
			slog.String("clientId", clientID),
		)
		return
	}

	rm.logger.Debug("Sent JOIN_ROOM_ERROR", slog.String("roomId", roomID), slog.String("message", errorMessage), slog.String("clientId", clientID))
}
