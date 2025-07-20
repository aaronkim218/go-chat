package hub

import (
	"log/slog"
	"sync"
	"time"

	"go-chat/internal/constants"
	"go-chat/internal/storage"

	"github.com/google/uuid"
)

type AddClientRequest struct {
	RoomId uuid.UUID
	Client *Client
}

type Config struct {
	Storage         storage.Storage
	Workers         int
	Logger          *slog.Logger
	StatsInterval   time.Duration
	CleanupInterval time.Duration
}

type Hub struct {
	activeRooms    map[uuid.UUID]*activeRoom
	mu             sync.Mutex
	storage        storage.Storage
	logger         *slog.Logger
	pluginRegistry *pluginRegistry
}

func New(cfg *Config) *Hub {
	hub := &Hub{
		activeRooms:    make(map[uuid.UUID]*activeRoom),
		storage:        cfg.Storage,
		logger:         cfg.Logger,
		pluginRegistry: createPluginRegistry(),
	}

	go hub.cleanup(cfg.CleanupInterval)
	go hub.stats(cfg.StatsInterval)

	return hub
}

func (h *Hub) AddClient(client *Client, roomId uuid.UUID) {
	h.loadActiveRoom(roomId).handleClientJoin(client)
}

func (h *Hub) loadActiveRoom(roomId uuid.UUID) *activeRoom {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, ok := h.activeRooms[roomId]
	if !ok {
		room = newActiveRoom(&activeRoomConfig{
			RoomId:         roomId,
			Storage:        h.storage,
			Logger:         h.logger,
			PluginRegistry: h.pluginRegistry,
		})
		h.activeRooms[roomId] = room
	}

	return room
}

func (h *Hub) cleanup(interval time.Duration) {
	ticker := time.NewTicker(interval)

	for range ticker.C {
		h.mu.Lock()
		for roomId, room := range h.activeRooms {
			room.mu.RLock()
			if len(room.clients) == 0 {
				delete(h.activeRooms, roomId)
				close(room.broadcast)
				h.logger.Info("Deleted room", slog.String("id", roomId.String()))
			}
			room.mu.RUnlock()
		}
		h.mu.Unlock()
	}
}

func (h *Hub) stats(interval time.Duration) {
	ticker := time.NewTicker(interval)

	for range ticker.C {
		h.mu.Lock()
		h.logger.Info("Hub stats", slog.Int("num active rooms", len(h.activeRooms)))
		h.mu.Unlock()
	}
}

func createPluginRegistry() *pluginRegistry {
	registry := newPluginRegistry(&pluginRegistryConfig{})

	userMessage := newUserMessagePlugin(&userMessagePluginConfig{})
	presence := newPresencePlugin(&presencePluginConfig{})
	typingStatus := newTypingStatusPlugin(&typingStatusPluginConfig{
		Timeout:         constants.TypingStatusTimeout,
		CleanupInterval: constants.TypingStatusCleanupInterval,
	})

	// client join plugins
	registry.registerClientJoinPlugin(presence)
	registry.registerClientJoinPlugin(typingStatus)

	// client message plugins
	registry.registerBroadcastMessagePlugin(userMessage)
	registry.registerBroadcastMessagePlugin(typingStatus)

	// client leave plugins
	registry.registerClientLeavePlugin(presence)
	registry.registerClientLeavePlugin(typingStatus)

	return registry
}
