package plugins

import (
	"encoding/json"
	"log/slog"
	"sync"

	"go-chat/internal/eventsocket"
	"go-chat/internal/models"
)

const (
	presenceMessageType = "PRESENCE"
)

type action string

const (
	join  action = "JOIN"
	leave action = "LEAVE"
)

type outgoingPresence struct {
	RoomID   string           `json:"room_id"`
	Profiles []models.Profile `json:"profiles"`
	Action   action           `json:"action"`
}

type Presence struct {
	eventsocket    *eventsocket.Eventsocket
	logger         *slog.Logger
	activeUsers    map[string]map[string]models.Profile
	clientProfiles map[string]models.Profile
	mu             sync.RWMutex
}

type PresenceConfig struct {
	Eventsocket *eventsocket.Eventsocket
	Logger      *slog.Logger
}

func NewEventsocketPresencePlugin(cfg *PresenceConfig) *Presence {
	plugin := &Presence{
		eventsocket:    cfg.Eventsocket,
		logger:         cfg.Logger,
		activeUsers:    make(map[string]map[string]models.Profile),
		clientProfiles: make(map[string]models.Profile),
	}

	plugin.eventsocket.OnRemoveClient("presence", plugin.unregisterClient)

	plugin.eventsocket.OnJoinRoom("presence", func(roomID, clientID string) {
		if err := plugin.handleJoinRoom(roomID, clientID); err != nil {
			plugin.logger.Error("Failed to handle user join presence",
				slog.String("err", err.Error()),
				slog.String("clientId", clientID),
				slog.String("roomId", roomID),
			)
		}
	})

	plugin.eventsocket.OnLeaveRoom("presence", func(roomID, clientID string) {
		if err := plugin.handleLeaveRoom(roomID, clientID); err != nil {
			plugin.logger.Error("Failed to handle user leave presence",
				slog.String("err", err.Error()),
				slog.String("clientId", clientID),
				slog.String("roomId", roomID),
			)
		}
	})

	return plugin
}

func (pp *Presence) RegisterClient(clientID string, profile models.Profile) {
	pp.mu.Lock()
	defer pp.mu.Unlock()

	pp.clientProfiles[clientID] = profile

	pp.logger.Debug("Registered client profile",
		slog.String("clientId", clientID),
		slog.String("username", profile.Username),
	)
}

func (pp *Presence) unregisterClient(clientID string) {
	pp.mu.Lock()
	defer pp.mu.Unlock()

	delete(pp.clientProfiles, clientID)

	pp.logger.Debug("Removed client profile on disconnect", slog.String("clientId", clientID))
}

func (pp *Presence) handleJoinRoom(roomID, clientID string) error {
	pp.mu.Lock()
	defer pp.mu.Unlock()

	joiningProfile, exists := pp.clientProfiles[clientID]
	if !exists {
		pp.logger.Error("Client profile not found for join",
			slog.String("clientId", clientID),
			slog.String("roomId", roomID),
		)
		return nil
	}

	if pp.activeUsers[roomID] == nil {
		pp.activeUsers[roomID] = make(map[string]models.Profile)
	}

	var activeProfiles []models.Profile
	for _, profile := range pp.activeUsers[roomID] {
		activeProfiles = append(activeProfiles, profile)
	}

	if len(activeProfiles) > 0 {
		if err := pp.sendPresenceToClient(clientID, roomID, activeProfiles, join); err != nil {
			pp.logger.Error("Failed to send existing users to joining client",
				slog.String("err", err.Error()),
				slog.String("clientId", clientID),
				slog.String("roomId", roomID),
			)
		}
	}

	pp.activeUsers[roomID][clientID] = joiningProfile

	if err := pp.broadcastPresenceToRoom(roomID, clientID, []models.Profile{joiningProfile}, join); err != nil {
		pp.logger.Error("Failed to broadcast user join",
			slog.String("err", err.Error()),
			slog.String("clientId", clientID),
			slog.String("roomId", roomID),
		)
		return err
	}

	pp.logger.Info("User joined room presence",
		slog.String("clientId", clientID),
		slog.String("roomId", roomID),
		slog.String("username", joiningProfile.Username),
	)

	return nil
}

func (pp *Presence) handleLeaveRoom(roomID, clientID string) error {
	pp.mu.Lock()
	defer pp.mu.Unlock()

	leavingProfile, exists := pp.activeUsers[roomID][clientID]
	if !exists {
		pp.logger.Debug("User not in room active users",
			slog.String("clientId", clientID),
			slog.String("roomId", roomID),
		)
		return nil
	}

	delete(pp.activeUsers[roomID], clientID)

	if len(pp.activeUsers[roomID]) == 0 {
		delete(pp.activeUsers, roomID)
	}

	if err := pp.broadcastPresenceToRoom(roomID, "", []models.Profile{leavingProfile}, leave); err != nil {
		pp.logger.Error("Failed to broadcast user leave",
			slog.String("err", err.Error()),
			slog.String("clientId", clientID),
			slog.String("roomId", roomID),
		)
		return err
	}

	pp.logger.Info("User left room presence",
		slog.String("clientId", clientID),
		slog.String("roomId", roomID),
		slog.String("username", leavingProfile.Username),
	)

	return nil
}

func (pp *Presence) sendPresenceToClient(clientID, roomID string, profiles []models.Profile, action action) error {
	data, err := json.Marshal(outgoingPresence{
		RoomID:   roomID,
		Profiles: profiles,
		Action:   action,
	})
	if err != nil {
		return err
	}

	message := eventsocket.Message{
		Type: presenceMessageType,
		Data: data,
	}

	if err := pp.eventsocket.BroadcastToClient(clientID, message); err != nil {
		pp.logger.Error("Failed to send delayed presence to client",
			slog.String("err", err.Error()),
			slog.String("clientId", clientID),
			slog.String("roomId", roomID),
		)
	}

	return nil
}

func (pp *Presence) broadcastPresenceToRoom(roomID, excludeClientID string, profiles []models.Profile, action action) error {
	data, err := json.Marshal(outgoingPresence{
		RoomID:   roomID,
		Profiles: profiles,
		Action:   action,
	})
	if err != nil {
		return err
	}

	message := eventsocket.Message{
		Type: presenceMessageType,
		Data: data,
	}

	if excludeClientID != "" {
		return pp.eventsocket.BroadcastToRoomExcept(roomID, excludeClientID, message)
	} else {
		return pp.eventsocket.BroadcastToRoom(roomID, message)
	}
}
