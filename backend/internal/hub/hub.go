package hub

import (
	"go-chat/internal/storage"
	"go-chat/internal/types"

	"github.com/google/uuid"
)

type Hub struct {
	rooms   map[uuid.UUID]map[*types.Client]struct{}
	storage storage.Storage
	join    chan joinRequest
	leave   chan leaveRequest
}

type Config struct {
	Storage storage.Storage
}

type joinRequest struct {
	roomId uuid.UUID
	client *types.Client
}

type leaveRequest struct {
	roomId uuid.UUID
	client *types.Client
}

func New(cfg *Config) *Hub {
	hub := &Hub{
		rooms:   make(map[uuid.UUID]map[*types.Client]struct{}),
		storage: cfg.Storage,
		join:    make(chan joinRequest),
		leave:   make(chan leaveRequest),
	}

	go hub.run()

	return hub
}

func (h *Hub) JoinClient(roomId uuid.UUID, client *types.Client) {
	h.join <- joinRequest{
		roomId: roomId,
		client: client,
	}
}

func (h *Hub) LeaveClient(roomId uuid.UUID, client *types.Client) {
	h.leave <- leaveRequest{
		roomId: roomId,
		client: client,
	}
}

func (h *Hub) run() {
	for {
		select {

		case req := <-h.join:
			if clients, ok := h.rooms[req.roomId]; ok {
				clients[req.client] = struct{}{}
			} else {
				h.rooms[req.roomId] = map[*types.Client]struct{}{
					req.client: {},
				}
				go h.handleRoom(req.roomId)
			}

			go h.handleClient(req.client)

		case req := <-h.leave:
			if clients, ok := h.rooms[req.roomId]; ok {
				delete(clients, req.client)
				if len(clients) == 0 {
					delete(h.rooms, req.roomId)
				}
			}
		}
	}
}

func (h *Hub) handleRoom(roomId uuid.UUID) {
	var broadcast chan []byte

}

func (h *Hub) handleClient(client *types.Client) {

}
