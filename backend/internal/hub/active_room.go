package hub

import (
	"log/slog"

	"go-chat/internal/storage"
	"go-chat/internal/types"

	"github.com/google/uuid"
)

type activeRoom struct {
	roomId         uuid.UUID
	clients        map[*types.Client]struct{}
	broadcast      chan types.ClientMessage
	join           chan *types.Client
	leave          chan *types.Client
	done           chan struct{}
	writeJobs      chan<- types.ClientMessage
	storage        storage.Storage
	logger         *slog.Logger
	pluginRegistry *PluginRegistry
}

func (ar *activeRoom) handleClient(client *types.Client) {
	for {
		var wsm types.WsMessage
		if err := client.Conn.ReadJSON(&wsm); err != nil {
			ar.logger.Info(
				"error reading message from client. closing connection",
				slog.String("ip", client.Conn.IP()),
				slog.String("error", err.Error()),
			)

			if err := client.Conn.Close(); err != nil {
				ar.logger.Error("error closing connection",
					slog.String("error", err.Error()),
				)
			}
			ar.leave <- client

			return
		}

		ar.broadcast <- types.ClientMessage{
			Client:    client,
			WsMessage: wsm,
		}
	}
}

func (ar *activeRoom) handleClientMessage(clientMessage types.ClientMessage) {
	if err := ar.pluginRegistry.HandleClientMessage(ar, clientMessage); err != nil {
		ar.logger.Error("plugin failed to handle message",
			slog.String("error", err.Error()),
			slog.String("message_type", string(clientMessage.WsMessage.Type)),
			slog.Any("message_data", clientMessage.WsMessage.Payload),
		)
	}
}

func (ar *activeRoom) handleClientJoin(client *types.Client) {
	if err := ar.pluginRegistry.HandleClientJoin(ar, client); err != nil {
		ar.logger.Error("plugin failed to handle message",
			slog.String("error", err.Error()),
		)
	}
}

func (ar *activeRoom) handleClientLeave(client *types.Client) {
	if err := ar.pluginRegistry.HandleClientLeave(ar, client); err != nil {
		ar.logger.Error("plugin failed to handle message",
			slog.String("error", err.Error()),
		)
	}
}
