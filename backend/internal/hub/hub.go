package hub

import (
	"context"
	"go-chat/internal/models"
	"go-chat/internal/storage"
	"go-chat/internal/types"
	"log/slog"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/google/uuid"
)

type Hub struct {
	activeRooms map[uuid.UUID]*activeRoom
	storage     storage.Storage
	addClient   chan AddClientRequest
	deleteRoom  chan uuid.UUID
}

type AddClientRequest struct {
	RoomId uuid.UUID
	Client *types.Client
}

type Config struct {
	Storage storage.Storage
}

func New(cfg *Config) *Hub {
	hub := &Hub{
		activeRooms: make(map[uuid.UUID]*activeRoom),
		storage:     cfg.Storage,
		addClient:   make(chan AddClientRequest),
		deleteRoom:  make(chan uuid.UUID),
	}

	go hub.run()

	return hub
}

func (h *Hub) AddClient(req AddClientRequest) {
	h.addClient <- req
}

func (h *Hub) run() {
	for {
		select {
		case req := <-h.addClient:
			ar, ok := h.activeRooms[req.RoomId]
			if !ok {
				ctx, cancel := context.WithCancel(context.TODO())
				ar = &activeRoom{
					clients:   make(map[*types.Client]struct{}),
					broadcast: make(chan []byte),
					join:      make(chan *types.Client),
					leave:     make(chan *types.Client),
					ctx:       ctx,
					cancel:    cancel,
				}
				h.activeRooms[req.RoomId] = ar
				go h.handleActiveRoom(req.RoomId, ar)
			}

			ar.join <- req.Client
		case roomId := <-h.deleteRoom:
			if len(h.activeRooms[roomId].clients) == 0 {
				h.activeRooms[roomId].cancel()
				delete(h.activeRooms, roomId)
				// slog.Info(
				// 	"deleted active room",
				// 	slog.String("room_id", roomId.String()),
				// )
			}
		}
	}
}

func (h *Hub) handleActiveRoom(roomId uuid.UUID, ar *activeRoom) {
	for {
		select {
		case <-ar.ctx.Done():
			return
		case message := <-ar.broadcast:
			for client := range ar.clients {
				if err := client.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
					client.Conn.Close()

					// slog.Info(
					// 	"error writing message to client. closed connection",
					// 	slog.String("ip", client.Conn.IP()),
					// 	slog.String("error", err.Error()),
					// )
				}

				messageId, err := uuid.NewRandom()
				if err != nil {
					slog.Error(
						"error generating message id",
						slog.String("error", err.Error()),
					)

					continue
				}

				if err := h.storage.CreateMessage(context.TODO(), models.Message{
					Id:        messageId,
					RoomId:    roomId,
					CreatedAt: time.Now(),
					Content:   string(message),
				}); err != nil {

				}
			}
		case client := <-ar.join:
			ar.clients[client] = struct{}{}
			go ar.handleClient(client)
		case client := <-ar.leave:
			client.Cancel()
			delete(ar.clients, client)
			// slog.Info(
			// 	"deleted client from active room",
			// 	slog.String("ip", client.Conn.IP()),
			// 	slog.String("room_id", roomId.String()),
			// )
			if len(ar.clients) == 0 {
				h.deleteRoom <- roomId
			}
		}
	}
}
