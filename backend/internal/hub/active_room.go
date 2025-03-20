package hub

import (
	"go-chat/internal/types"
	"log/slog"
	"sync"
)

type activeRoom struct {
	clients   map[types.Client]struct{}
	broadcast chan []byte
	mu        sync.Mutex
}

func (ar *activeRoom) handleClient(client types.Client) {
	defer ar.deleteClient(client)

	for {
		_, msg, err := client.Conn.ReadMessage()
		if err != nil {
			slog.Info(
				"error reading message from client",
				slog.String("client_id", client.Id.String()),
				slog.String("error", err.Error()),
			)
			return
		}

		ar.broadcast <- msg
	}
}

// 1. closes a clients connection
// 2. removes the client from the active room
// 3. if the room is empty, closes the broadcast channel
func (ar *activeRoom) deleteClient(client types.Client) {
	ar.mu.Lock()
	client.Conn.Close()
	delete(ar.clients, client)
	if len(ar.clients) == 0 {
		close(ar.broadcast)
	}
	ar.mu.Unlock()
}
