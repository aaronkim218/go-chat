package hub

import (
	"go-chat/internal/storage"
	"go-chat/internal/types"
	"log/slog"
	"sync"

	"github.com/gofiber/contrib/websocket"
	"github.com/google/uuid"
)

type Hub struct {
	activeRooms map[uuid.UUID]*activeRoom
	storage     storage.Storage
	mu          sync.Mutex
}

type AddClientRequest struct {
	RoomId uuid.UUID
	Client types.Client
}

type Config struct {
	Storage storage.Storage
}

func New(cfg *Config) *Hub {
	hub := &Hub{
		activeRooms: make(map[uuid.UUID]*activeRoom),
		storage:     cfg.Storage,
	}

	return hub
}

func (h *Hub) AddClient(req AddClientRequest) {
	h.mu.Lock()
	ar, ok := h.activeRooms[req.RoomId]
	if !ok {
		ar = &activeRoom{
			clients:   make(map[types.Client]struct{}),
			broadcast: make(chan []byte),
		}
		h.activeRooms[req.RoomId] = ar
		go h.handleActiveRoom(req.RoomId, ar)
	}
	h.mu.Unlock()

	ar.mu.Lock()
	ar.clients[req.Client] = struct{}{}
	ar.mu.Unlock()
	go ar.handleClient(req.Client)
}

func (h *Hub) handleActiveRoom(roomId uuid.UUID, ar *activeRoom) {
	for message := range ar.broadcast {
		for client := range ar.clients {
			if err := client.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				slog.Info(
					"error writing message to client",
					slog.String("client_id", client.Id.String()),
					slog.String("error", err.Error()),
				)

				ar.deleteClient(client)
			}
		}
	}

	// at this point broadcast channel must be closed, signaling that room is empty and ready to be deleted
	h.mu.Lock()
	delete(h.activeRooms, roomId)
	h.mu.Unlock()
}
