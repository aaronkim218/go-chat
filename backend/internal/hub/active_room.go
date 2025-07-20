package hub

import (
	"log/slog"
	"sync"

	"go-chat/internal/storage"

	"github.com/google/uuid"
)

type activeRoomConfig struct {
	RoomId         uuid.UUID
	Storage        storage.Storage
	Logger         *slog.Logger
	PluginRegistry *pluginRegistry
}

type activeRoom struct {
	roomId         uuid.UUID
	clients        map[*Client]struct{}
	mu             sync.RWMutex
	broadcast      chan broadcastMessage
	storage        storage.Storage
	logger         *slog.Logger
	pluginRegistry *pluginRegistry
}

func newActiveRoom(cfg *activeRoomConfig) *activeRoom {
	ar := &activeRoom{
		roomId:         cfg.RoomId,
		clients:        make(map[*Client]struct{}),
		broadcast:      make(chan broadcastMessage),
		storage:        cfg.Storage,
		logger:         cfg.Logger,
		pluginRegistry: cfg.PluginRegistry,
	}

	go ar.handleBroadcast()

	return ar
}

func (ar *activeRoom) handleBroadcast() {
	for bm := range ar.broadcast {
		ar.handleBroadcastMessage(bm)
	}
}

func (ar *activeRoom) handleReadClient(client *Client) {
	for {
		var wsm wsMessage
		if err := client.conn.ReadJSON(&wsm); err != nil {
			ar.logger.Error("Error reading message from client. closing connection", slog.String("error", err.Error()))
			client.closeConn()
			ar.handleClientLeave(client)
			return
		}

		ar.broadcast <- broadcastMessage{
			client:    client,
			wsMessage: wsm,
		}
	}
}

func (ar *activeRoom) handleBroadcastMessage(msg broadcastMessage) {
	if err := ar.pluginRegistry.handleBroadcastMessage(ar, msg); err != nil {
		ar.logger.Error("Plugin failed to handle message",
			slog.String("err", err.Error()),
			slog.String("type", string(msg.wsMessage.Type)),
			slog.Any("payload", msg.wsMessage.Payload),
		)
	}
}

func (ar *activeRoom) handleClientJoin(client *Client) {
	ar.mu.Lock()
	ar.clients[client] = struct{}{}
	ar.mu.Unlock()
	go ar.handleReadClient(client)

	if err := ar.pluginRegistry.handleClientJoin(ar, client); err != nil {
		ar.logger.Error("Plugin failed to handle message", slog.String("err", err.Error()))
	}
}

func (ar *activeRoom) handleClientLeave(client *Client) {
	ar.mu.Lock()
	delete(ar.clients, client)
	ar.mu.Unlock()

	if err := ar.pluginRegistry.handleClientLeave(ar, client); err != nil {
		ar.logger.Error("Plugin failed to handle message", slog.String("err", err.Error()))
	}

	close(client.write)
	client.done <- struct{}{}
}
