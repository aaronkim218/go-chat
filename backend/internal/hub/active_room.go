package hub

import (
	"context"
	"go-chat/internal/types"
	"log/slog"

	"github.com/google/uuid"
)

type broadcastMessage struct {
	UserId  uuid.UUID
	Message []byte
}

type activeRoom struct {
	clients   map[*types.Client]struct{}
	broadcast chan broadcastMessage
	join      chan *types.Client
	leave     chan *types.Client
	ctx       context.Context
	cancel    context.CancelFunc
}

func (ar *activeRoom) handleClient(client *types.Client) {
	for {
		_, msg, err := client.Conn.ReadMessage()
		if err != nil {
			slog.Info(
				"error reading message from client. closing connection",
				slog.String("ip", client.Conn.IP()),
				slog.String("error", err.Error()),
			)

			client.Conn.Close()
			ar.leave <- client

			return
		}

		select {
		case <-ar.ctx.Done():
			return
		case ar.broadcast <- broadcastMessage{
			UserId:  client.UserId,
			Message: msg,
		}:
		}
	}
}
