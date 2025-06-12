package hub

import (
	"context"
	"log/slog"
	"time"

	"go-chat/internal/constants"
	"go-chat/internal/models"
	"go-chat/internal/storage"
	"go-chat/internal/types"

	"github.com/google/uuid"
)

type Hub struct {
	activeRooms map[uuid.UUID]*activeRoom
	storage     storage.Storage
	addClient   chan AddClientRequest
	deleteRoom  chan uuid.UUID
	writeJobs   chan writeJob
}

type AddClientRequest struct {
	RoomId uuid.UUID
	Client *types.Client
}

type Config struct {
	Storage storage.Storage
	Workers int
	Logger  *slog.Logger
}

type writeJob struct {
	client      *types.Client
	userMessage types.UserMessage
}

func New(cfg *Config) *Hub {
	hub := &Hub{
		activeRooms: make(map[uuid.UUID]*activeRoom),
		storage:     cfg.Storage,
		addClient:   make(chan AddClientRequest),
		deleteRoom:  make(chan uuid.UUID),
		writeJobs:   make(chan writeJob, cfg.Workers),
	}

	for id := range cfg.Workers {
		go hub.writeWorker(id)
	}

	go hub.run()

	return hub
}

func (h *Hub) AddClient(req AddClientRequest) {
	h.addClient <- req
}

func (h *Hub) run() {
	ticker := time.NewTicker(constants.HubStatsInterval)

	for {
		select {
		case req := <-h.addClient:
			ar, ok := h.activeRooms[req.RoomId]
			if !ok {
				ctx, cancel := context.WithCancel(context.TODO())
				ar = &activeRoom{
					clients:   make(map[*types.Client]struct{}),
					broadcast: make(chan broadcastMessage),
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
				slog.Info(
					"deleted active room",
					slog.String("room_id", roomId.String()),
				)
			}
		case <-ticker.C:
			slog.Info("hub stats",
				slog.Int("number of active rooms", len(h.activeRooms)),
			)
		}
	}
}

func (h *Hub) handleActiveRoom(roomId uuid.UUID, ar *activeRoom) {
	for {
		select {
		case <-ar.ctx.Done():
			return
		case broadcastMessage := <-ar.broadcast:
			messageId, err := uuid.NewRandom()
			if err != nil {
				slog.Error(
					"error generating message id",
					slog.String("error", err.Error()),
				)

				continue
			}

			message := models.Message{
				Id:        messageId,
				RoomId:    roomId,
				CreatedAt: time.Now(),
				Author:    broadcastMessage.client.Profile.UserId,
				Content:   string(broadcastMessage.message),
			}

			if err := h.storage.CreateMessage(context.TODO(), message); err != nil {
				slog.Error(
					"error creating message in storage",
					slog.String("error", err.Error()),
				)

				continue
			}

			userMessage := types.UserMessage{
				Message:   message,
				Username:  broadcastMessage.client.Profile.Username,
				FirstName: broadcastMessage.client.Profile.FirstName,
				LastName:  broadcastMessage.client.Profile.LastName,
			}

			for client := range ar.clients {
				h.writeJobs <- writeJob{
					client:      client,
					userMessage: userMessage,
				}
			}
		case client := <-ar.join:
			ar.clients[client] = struct{}{}
			go ar.handleClient(client)
		case client := <-ar.leave:
			client.Cancel()
			delete(ar.clients, client)
			slog.Info(
				"deleted client from active room",
				slog.String("ip", client.Conn.IP()),
				slog.String("room_id", roomId.String()),
			)
			if len(ar.clients) == 0 {
				h.deleteRoom <- roomId
			}
		}
	}
}

func (h *Hub) writeWorker(id int) {
	for job := range h.writeJobs {
		slog.Info("job picked up by worker", slog.Int("id", id))
		if err := job.client.Conn.WriteJSON(job.userMessage); err != nil {
			if err := job.client.Conn.Close(); err != nil {
				slog.Error("error closing connection",
					slog.String("error", err.Error()),
				)
				continue
			}

			slog.Info(
				"error writing user message to client. closed connection",
				slog.String("ip", job.client.Conn.IP()),
				slog.String("error", err.Error()),
			)
		}
	}
}
