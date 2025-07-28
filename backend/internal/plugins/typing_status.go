package plugins

import (
	"sync"
	"time"

	"go-chat/internal/models"

	"github.com/aaronkim218/hubsocket"
	go_json "github.com/goccy/go-json"
)

const typingStatusType hubsocket.WsMessageType = "TYPING_STATUS"

type incomingTypingStatus struct {
	Profile models.Profile `json:"profile"`
}

type outgoingTypingStatus struct {
	Profiles []models.Profile `json:"profiles"`
}

type TypingStatusPluginConfig struct {
	Timeout         time.Duration
	CleanupInterval time.Duration
}

type TypingStatusPlugin struct {
	typing  map[*hubsocket.ActiveRoom[models.Profile]]map[*hubsocket.Client[models.Profile]]time.Time
	mu      sync.RWMutex
	timeout time.Duration
}

func NewTypingStatusPlugin(cfg *TypingStatusPluginConfig) *TypingStatusPlugin {
	tsp := &TypingStatusPlugin{
		typing:  make(map[*hubsocket.ActiveRoom[models.Profile]]map[*hubsocket.Client[models.Profile]]time.Time),
		timeout: cfg.Timeout,
	}

	go tsp.cleanup(cfg.CleanupInterval)

	return tsp
}

func (tsp *TypingStatusPlugin) MessageType() hubsocket.WsMessageType {
	return typingStatusType
}

func (tsp *TypingStatusPlugin) HandleClientJoin(room *hubsocket.ActiveRoom[models.Profile], client *hubsocket.Client[models.Profile]) error {
	profiles := tsp.getTypingProfiles(room, client)
	if profiles == nil {
		return nil
	}

	payload, err := go_json.Marshal(outgoingTypingStatus{
		Profiles: profiles,
	})
	if err != nil {
		return err
	}

	client.Write <- hubsocket.WsMessage{
		Type:    typingStatusType,
		Payload: payload,
	}

	return nil
}

func (tsp *TypingStatusPlugin) HandleBroadcastMessage(room *hubsocket.ActiveRoom[models.Profile], msg hubsocket.BroadcastMessage[models.Profile]) error {
	var incoming incomingTypingStatus
	if err := go_json.Unmarshal(msg.WsMessage.Payload, &incoming); err != nil {
		return err
	}

	tsp.setClientTyping(room, msg.Client)

	payload, err := go_json.Marshal(outgoingTypingStatus{
		Profiles: []models.Profile{incoming.Profile},
	})
	if err != nil {
		return err
	}

	room.Mu.RLock()
	for c := range room.Clients {
		if c != msg.Client {
			c.Write <- hubsocket.WsMessage{
				Type:    typingStatusType,
				Payload: payload,
			}
		}
	}
	room.Mu.RUnlock()

	return nil
}

func (tsp *TypingStatusPlugin) HandleClientLeave(room *hubsocket.ActiveRoom[models.Profile], client *hubsocket.Client[models.Profile]) error {
	tsp.mu.Lock()
	delete(tsp.typing[room], client)
	tsp.mu.Unlock()

	return nil
}

func (tsp *TypingStatusPlugin) cleanup(interval time.Duration) {
	ticker := time.NewTicker(interval)

	for range ticker.C {
		tsp.mu.Lock()
		for ar, clients := range tsp.typing {
			for c, t := range clients {
				if time.Since(t) > tsp.timeout {
					delete(clients, c)
				}
			}

			if len(clients) == 0 {
				delete(tsp.typing, ar)
			}
		}
		tsp.mu.Unlock()
	}
}

func (tsp *TypingStatusPlugin) getTypingProfiles(room *hubsocket.ActiveRoom[models.Profile], client *hubsocket.Client[models.Profile]) []models.Profile {
	tsp.mu.RLock()
	defer tsp.mu.RUnlock()

	clients, ok := tsp.typing[room]
	if !ok {
		return nil
	}

	var profiles []models.Profile
	for c := range clients {
		if c != client {
			profiles = append(profiles, c.Metadata)
		}
	}

	return profiles
}

func (tsp *TypingStatusPlugin) setClientTyping(room *hubsocket.ActiveRoom[models.Profile], client *hubsocket.Client[models.Profile]) {
	tsp.mu.Lock()
	defer tsp.mu.Unlock()

	clients, ok := tsp.typing[room]
	if !ok {
		clients = make(map[*hubsocket.Client[models.Profile]]time.Time)
		tsp.typing[room] = clients
	}

	clients[client] = time.Now()
}
