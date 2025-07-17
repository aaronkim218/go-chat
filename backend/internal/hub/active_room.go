package hub

import (
	"log/slog"
	"sync"

	"go-chat/internal/storage"

	"github.com/google/uuid"
)

type activeRoom struct {
	roomId         uuid.UUID
	clients        map[*Client]struct{}
	mu             sync.RWMutex
	broadcast      chan ClientMessage
	storage        storage.Storage
	logger         *slog.Logger
	pluginRegistry *PluginRegistry
}

type activeRoomConfig struct {
	RoomId         uuid.UUID
	Storage        storage.Storage
	Logger         *slog.Logger
	PluginRegistry *PluginRegistry
}

func newActiveRoom(cfg *activeRoomConfig) *activeRoom {
	ar := &activeRoom{
		roomId:         cfg.RoomId,
		clients:        make(map[*Client]struct{}),
		broadcast:      make(chan ClientMessage),
		storage:        cfg.Storage,
		logger:         cfg.Logger,
		pluginRegistry: cfg.PluginRegistry,
	}

	go ar.handleBroadcast()

	return ar
}

func (ar *activeRoom) handleBroadcast() {
	for cm := range ar.broadcast {
		ar.handleClientMessage(cm)
	}
}

func (ar *activeRoom) handleReadClient(client *Client) {
	for {
		var wsm WsMessage
		if err := client.conn.ReadJSON(&wsm); err != nil {
			ar.logger.Error(
				"error reading message from client. closing connection",
				slog.String("ip", client.conn.IP()),
				slog.String("error", err.Error()),
			)

			client.closeConn()
			ar.handleClientLeave(client)
			return
		}

		ar.broadcast <- ClientMessage{
			Client:    client,
			WsMessage: wsm,
		}
	}
}

func (ar *activeRoom) handleClientMessage(clientMessage ClientMessage) {
	if err := ar.pluginRegistry.HandleClientMessage(ar, clientMessage); err != nil {
		ar.logger.Error("plugin failed to handle message",
			slog.String("error", err.Error()),
			slog.String("message_type", string(clientMessage.WsMessage.Type)),
			slog.Any("message_data", clientMessage.WsMessage.Payload),
		)
	}
}

func (ar *activeRoom) handleClientJoin(client *Client) {
	ar.mu.Lock()
	ar.clients[client] = struct{}{}
	ar.mu.Unlock()
	go ar.handleReadClient(client)

	if err := ar.pluginRegistry.HandleClientJoin(ar, client); err != nil {
		ar.logger.Error("plugin failed to handle message",
			slog.String("error", err.Error()),
		)
	}
}

func (ar *activeRoom) handleClientLeave(client *Client) {
	ar.mu.Lock()
	delete(ar.clients, client)
	ar.mu.Unlock()

	if err := ar.pluginRegistry.HandleClientLeave(ar, client); err != nil {
		ar.logger.Error("plugin failed to handle message",
			slog.String("error", err.Error()),
		)
	}

	close(client.write)
	client.done <- struct{}{}
}
