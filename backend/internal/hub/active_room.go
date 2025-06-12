package hub

import (
	"context"
	"log/slog"

	"go-chat/internal/types"
)

type broadcastMessage struct {
	client  *types.Client
	message []byte
}

type activeRoom struct {
	clients   map[*types.Client]struct{}
	broadcast chan broadcastMessage
	join      chan *types.Client
	leave     chan *types.Client
	ctx       context.Context
	cancel    context.CancelFunc
	logger    *slog.Logger
}

func (ar *activeRoom) handleClient(client *types.Client) {
	for {
		_, msg, err := client.Conn.ReadMessage()
		if err != nil {
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

		select {
		case <-ar.ctx.Done():
			return
		case ar.broadcast <- broadcastMessage{
			client:  client,
			message: msg,
		}:
		}
	}
}
