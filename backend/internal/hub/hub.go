package hub

import (
	"log/slog"
	"sync"
	"time"

	"go-chat/internal/constants"
	"go-chat/internal/storage"

	"github.com/google/uuid"
)

type Hub struct {
	activeRooms    map[uuid.UUID]*activeRoom
	mu             sync.Mutex
	storage        storage.Storage
	logger         *slog.Logger
	pluginRegistry *PluginRegistry
}

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

	ar, ok := h.activeRooms[roomId]
	if !ok {
		ar = newActiveRoom(&activeRoomConfig{
			RoomId:         roomId,
			Storage:        h.storage,
			Logger:         h.logger,
			PluginRegistry: h.pluginRegistry,
		})
		h.activeRooms[roomId] = ar
	}

	return ar
}

func (h *Hub) cleanup(interval time.Duration) {
	ticker := time.NewTicker(interval)

	for range ticker.C {
		h.mu.Lock()
		for roomId, ar := range h.activeRooms {
			ar.mu.RLock()
			if len(ar.clients) == 0 {
				delete(h.activeRooms, roomId)
				close(ar.broadcast)
				h.logger.Info("deleted room", slog.String("room_id", roomId.String()))
			}
			ar.mu.RUnlock()
		}
		h.mu.Unlock()
	}
}

func (h *Hub) stats(interval time.Duration) {
	ticker := time.NewTicker(interval)

	for range ticker.C {
		h.mu.Lock()
		h.logger.Info("hub stats", slog.Int("number of active rooms", len(h.activeRooms)))
		h.mu.Unlock()
	}
}

func createPluginRegistry() *PluginRegistry {
	registry := NewPluginRegistry(&PluginRegistryConfig{})

	userMessagePlugin := NewUserMessagePlugin(&UserMessagePluginConfig{})
	presencePlugin := NewPresencePlugin(&PresencePluginConfig{})
	typingStatusPlugin := NewTypingStatusPlugin(&TypingStatusPluginConfig{
		Timeout:         constants.TypingStatusTimeout,
		CleanupInterval: constants.TypingStatusCleanupInterval,
	})

	// client join plugins
	registry.RegisterClientJoinPlugin(presencePlugin)
	registry.RegisterClientJoinPlugin(typingStatusPlugin)

	// client message plugins
	registry.RegisterClientMessagePlugin(userMessagePlugin)
	registry.RegisterClientMessagePlugin(typingStatusPlugin)

	// client leave plugins
	registry.RegisterClientLeavePlugin(presencePlugin)
	registry.RegisterClientLeavePlugin(typingStatusPlugin)

	return registry
}
