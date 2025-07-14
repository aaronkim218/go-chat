package hub

import (
	"log/slog"
	"time"

	"go-chat/internal/constants"
	"go-chat/internal/storage"
	"go-chat/internal/types"

	"github.com/google/uuid"
)

type Hub struct {
	activeRooms    map[uuid.UUID]*activeRoom
	storage        storage.Storage
	addClient      chan AddClientRequest
	deleteRoom     chan uuid.UUID
	writeJobs      chan types.ClientMessage
	logger         *slog.Logger
	pluginRegistry *PluginRegistry
}

type AddClientRequest struct {
	RoomId uuid.UUID
	Client *types.Client
}

type Config struct {
	Storage storage.Storage
	Workers int
	Logger  *slog.Logger
}

func New(cfg *Config) *Hub {
	hub := &Hub{
		activeRooms:    make(map[uuid.UUID]*activeRoom),
		storage:        cfg.Storage,
		addClient:      make(chan AddClientRequest),
		deleteRoom:     make(chan uuid.UUID),
		writeJobs:      make(chan types.ClientMessage, cfg.Workers),
		logger:         cfg.Logger,
		pluginRegistry: createPluginRegistry(),
	}

	for id := range cfg.Workers {
		go hub.writeWorker(id)
	}

	go hub.run()

	return hub
}

func createPluginRegistry() *PluginRegistry {
	registry := NewPluginRegistry(&PluginRegistryConfig{})

	presencePlugin := NewPresencePlugin(&PresencePluginConfig{})

	// client join plugins
	registry.RegisterClientJoinPlugin(presencePlugin)

	// client message plugins
	registry.RegisterClientMessagePlugin(NewUserMessagePlugin(&UserMessagePluginConfig{}))

	// client leave plugins
	registry.RegisterClientLeavePlugin(presencePlugin)

	return registry
}

func (h *Hub) AddClient(req AddClientRequest) {
	h.addClient <- req
}

func (h *Hub) run() {
	ticker := time.NewTicker(constants.HubStatsInterval)

	for {
		select {
		case req := <-h.addClient:
			ar, ok := h.activeRooms[req.RoomId]
			if !ok {
				ar = &activeRoom{
					roomId:         req.RoomId,
					clients:        make(map[*types.Client]struct{}),
					broadcast:      make(chan types.ClientMessage),
					join:           make(chan *types.Client),
					leave:          make(chan *types.Client),
					done:           make(chan struct{}),
					writeJobs:      h.writeJobs,
					storage:        h.storage,
					logger:         h.logger,
					pluginRegistry: h.pluginRegistry,
				}
				h.activeRooms[req.RoomId] = ar
				go h.handleActiveRoom(ar)
			}

			ar.join <- req.Client
		case roomId := <-h.deleteRoom:
			if len(h.activeRooms[roomId].clients) == 0 {
				h.activeRooms[roomId].done <- struct{}{}
				delete(h.activeRooms, roomId)
				h.logger.Info(
					"deleted active room",
					slog.String("room_id", roomId.String()),
				)
			}
		case <-ticker.C:
			h.logger.Info("hub stats",
				slog.Int("number of active rooms", len(h.activeRooms)),
			)
		}
	}
}

func (h *Hub) handleActiveRoom(ar *activeRoom) {
	for {
		select {
		case <-ar.done:
			return
		case cm := <-ar.broadcast:
			ar.handleClientMessage(cm)
		case client := <-ar.join:
			ar.clients[client] = struct{}{}
			go ar.handleClient(client)
			ar.handleClientJoin(client)
		case client := <-ar.leave:
			client.Done <- struct{}{}
			delete(ar.clients, client)
			ar.handleClientLeave(client)
			h.logger.Info(
				"deleted client from active room",
				slog.String("ip", client.Conn.IP()),
				slog.String("room_id", ar.roomId.String()),
			)
			if len(ar.clients) == 0 {
				h.deleteRoom <- ar.roomId
			}
		}
	}
}

func (h *Hub) writeWorker(id int) {
	for job := range h.writeJobs {
		h.logger.Info("job picked up by worker", slog.Int("id", id))
		if err := job.Client.Conn.WriteJSON(job.WsMessage); err != nil {
			h.logger.Info(
				"error writing ws message to client. closed connection",
				slog.String("ip", job.Client.Conn.IP()),
				slog.String("error", err.Error()),
				slog.String("type", string(job.WsMessage.Type)),
				slog.Any("data", job.WsMessage.Payload),
			)

			if err := job.Client.Conn.Close(); err != nil {
				h.logger.Error("error closing connection",
					slog.String("error", err.Error()),
				)
			}
		}
	}
}
