package hub

import (
	"log/slog"

	"go-chat/internal/plugins"
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
	pluginRegistry *plugins.PluginRegistry
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

		switch wsm.Type {
		case types.UserMessageType:
			ar.broadcast <- types.ClientMessage{
				Client:    client,
				WsMessage: wsm,
			}
		default:
			ar.logger.Error("invalid ws message type", slog.String("type", string(wsm.Type)))
		}
	}
}

func (ar *activeRoom) handleBroadcastMessage(clientMessage types.ClientMessage) {
	pluginService := &plugins.PluginService{
		RoomId:    ar.roomId,
		Storage:   ar.storage,
		WriteJobs: ar.writeJobs,
		Logger:    ar.logger,
		Clients:   ar.clients,
	}

	if err := ar.pluginRegistry.HandleClientMessage(pluginService, clientMessage); err != nil {
		ar.logger.Error("plugin failed to handle message",
			slog.String("error", err.Error()),
			slog.String("message_type", string(clientMessage.WsMessage.Type)),
			slog.Any("message_data", clientMessage.WsMessage.Payload),
		)
	}
}
