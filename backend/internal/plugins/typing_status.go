package plugins

import (
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"go-chat/internal/eventsocket"
	"go-chat/internal/models"
)

type typingStatusPayload struct {
	RoomID  string         `json:"room_id"`
	Profile models.Profile `json:"profile"`
}

type outgoingTypingStatus struct {
	RoomID   string           `json:"room_id"`
	Profiles []models.Profile `json:"profiles"`
}

type TypingStatusPlugin struct {
	eventsocket     *eventsocket.Eventsocket
	logger          *slog.Logger
	typing          map[string]map[string]time.Time
	clientProfiles  map[string]models.Profile
	mu              sync.RWMutex
	timeout         time.Duration
	cleanupInterval time.Duration
}

type TypingStatusPluginConfig struct {
	Eventsocket     *eventsocket.Eventsocket
	Logger          *slog.Logger
	Timeout         time.Duration
	CleanupInterval time.Duration
}

func NewEventsocketTypingStatusPlugin(cfg *TypingStatusPluginConfig) *TypingStatusPlugin {
	plugin := &TypingStatusPlugin{
		eventsocket:     cfg.Eventsocket,
		logger:          cfg.Logger,
		typing:          make(map[string]map[string]time.Time),
		clientProfiles:  make(map[string]models.Profile),
		timeout:         cfg.Timeout,
		cleanupInterval: cfg.CleanupInterval,
	}

	plugin.eventsocket.OnRemoveClient("typing_status", plugin.unregisterClient)

	plugin.eventsocket.OnJoinRoom("typing_status", func(roomID, clientID string) {
		if err := plugin.handleJoinRoom(roomID, clientID); err != nil {
			plugin.logger.Error("Failed to handle typing status on join",
				slog.String("err", err.Error()),
				slog.String("clientId", clientID),
				slog.String("roomId", roomID),
			)
		}
	})

	plugin.eventsocket.OnLeaveRoom("typing_status", func(roomID, clientID string) {
		if err := plugin.handleLeaveRoom(roomID, clientID); err != nil {
			plugin.logger.Error("Failed to handle typing status on leave",
				slog.String("err", err.Error()),
				slog.String("clientId", clientID),
				slog.String("roomId", roomID),
			)
		}
	})

	go plugin.cleanup()

	return plugin
}

func (ts *TypingStatusPlugin) RegisterClient(client *eventsocket.Client, profile models.Profile) {
	clientID := client.ID()

	ts.mu.Lock()
	ts.clientProfiles[clientID] = profile
	ts.mu.Unlock()

	client.OnMessage("TYPING_STATUS", func(data json.RawMessage) {
		ts.HandleTypingStatus(clientID, data)
	})

	ts.logger.Debug("Registered client for typing status",
		slog.String("clientId", clientID),
		slog.String("username", profile.Username),
	)
}

func (ts *TypingStatusPlugin) unregisterClient(clientID string) {
	ts.mu.Lock()
	defer ts.mu.Unlock()

	delete(ts.clientProfiles, clientID)

	for roomID, clients := range ts.typing {
		delete(clients, clientID)
		if len(clients) == 0 {
			delete(ts.typing, roomID)
		}
	}

	ts.logger.Debug("Unregistered client from typing status",
		slog.String("clientId", clientID),
	)
}

func (ts *TypingStatusPlugin) handleJoinRoom(roomID, clientID string) error {
	typingProfiles := ts.getTypingProfiles(roomID, clientID)
	if len(typingProfiles) == 0 {
		return nil
	}

	return ts.sendTypingStatusToClient(clientID, roomID, typingProfiles)
}

func (ts *TypingStatusPlugin) handleLeaveRoom(roomID, clientID string) error {
	ts.mu.Lock()
	defer ts.mu.Unlock()

	if clients, exists := ts.typing[roomID]; exists {
		delete(clients, clientID)
		if len(clients) == 0 {
			delete(ts.typing, roomID)
		}
	}

	return nil
}

func (ts *TypingStatusPlugin) HandleTypingStatus(clientID string, data json.RawMessage) {
	var payload typingStatusPayload
	if err := json.Unmarshal(data, &payload); err != nil {
		ts.logger.Error("Failed to parse TYPING_STATUS payload",
			slog.String("err", err.Error()),
			slog.String("clientId", clientID),
		)
		return
	}

	roomID := payload.RoomID

	ts.setClientTyping(roomID, clientID)

	ts.mu.RLock()
	profile, exists := ts.clientProfiles[clientID]
	ts.mu.RUnlock()

	if !exists {
		ts.logger.Error("Client profile not found for typing status broadcast",
			slog.String("clientId", clientID),
		)
		return
	}

	if err := ts.broadcastTypingStatusToRoom(roomID, clientID, []models.Profile{profile}); err != nil {
		ts.logger.Error("Failed to broadcast typing status",
			slog.String("err", err.Error()),
			slog.String("clientId", clientID),
			slog.String("roomId", roomID),
		)
		return
	}

	ts.logger.Debug("Typing status processed successfully",
		slog.String("clientId", clientID),
		slog.String("roomId", roomID),
		slog.String("username", profile.Username),
	)
}

func (ts *TypingStatusPlugin) getTypingProfiles(roomID, excludeClientID string) []models.Profile {
	ts.mu.RLock()
	defer ts.mu.RUnlock()

	clients, exists := ts.typing[roomID]
	if !exists {
		return nil
	}

	var profiles []models.Profile
	for clientID := range clients {
		if clientID != excludeClientID {
			if profile, exists := ts.clientProfiles[clientID]; exists {
				profiles = append(profiles, profile)
			}
		}
	}

	return profiles
}

func (ts *TypingStatusPlugin) setClientTyping(roomID, clientID string) {
	ts.mu.Lock()
	defer ts.mu.Unlock()

	if ts.typing[roomID] == nil {
		ts.typing[roomID] = make(map[string]time.Time)
	}

	ts.typing[roomID][clientID] = time.Now()
}

func (ts *TypingStatusPlugin) sendTypingStatusToClient(clientID, roomID string, profiles []models.Profile) error {
	payloadData := outgoingTypingStatus{
		RoomID:   roomID,
		Profiles: profiles,
	}

	responseData, err := json.Marshal(payloadData)
	if err != nil {
		return err
	}

	message := eventsocket.Message{
		Type: "TYPING_STATUS",
		Data: responseData,
	}

	return ts.eventsocket.BroadcastToClient(clientID, message)
}

func (ts *TypingStatusPlugin) broadcastTypingStatusToRoom(roomID, excludeClientID string, profiles []models.Profile) error {
	payloadData := outgoingTypingStatus{
		RoomID:   roomID,
		Profiles: profiles,
	}

	responseData, err := json.Marshal(payloadData)
	if err != nil {
		return err
	}

	message := eventsocket.Message{
		Type: "TYPING_STATUS",
		Data: responseData,
	}

	if excludeClientID != "" {
		return ts.eventsocket.BroadcastToRoomExcept(roomID, excludeClientID, message)
	} else {
		return ts.eventsocket.BroadcastToRoom(roomID, message)
	}
}

func (ts *TypingStatusPlugin) cleanup() {
	ticker := time.NewTicker(ts.cleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		ts.mu.Lock()
		for roomID, clients := range ts.typing {
			for clientID, timestamp := range clients {
				if time.Since(timestamp) > ts.timeout {
					delete(clients, clientID)
				}
			}

			if len(clients) == 0 {
				delete(ts.typing, roomID)
			}
		}
		ts.mu.Unlock()
	}
}
