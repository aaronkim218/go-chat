package hub

import (
	"sync"
	"time"

	"go-chat/internal/models"

	go_json "github.com/goccy/go-json"
)

type incomingTypingStatus struct {
	Profile models.Profile `json:"profile"`
}

type outgoingTypingStatus struct {
	Profiles []models.Profile `json:"profiles"`
}

type typingStatusPluginConfig struct {
	timeout         time.Duration
	cleanupInterval time.Duration
}

type typingStatusPlugin struct {
	typing  map[*activeRoom]map[*Client]time.Time
	mu      sync.RWMutex
	timeout time.Duration
}

func newTypingStatusPlugin(cfg *typingStatusPluginConfig) *typingStatusPlugin {
	tsp := &typingStatusPlugin{
		typing:  make(map[*activeRoom]map[*Client]time.Time),
		timeout: cfg.timeout,
	}

	go tsp.cleanup(cfg.cleanupInterval)

	return tsp
}

func (tsp *typingStatusPlugin) messageType() wsMessageType {
	return typingStatusType
}

func (tsp *typingStatusPlugin) handleClientJoin(room *activeRoom, client *Client) error {
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

	client.write <- wsMessage{
		Type:    typingStatusType,
		Payload: payload,
	}

	return nil
}

func (tsp *typingStatusPlugin) handleBroadcastMessage(room *activeRoom, msg broadcastMessage) error {
	var incoming incomingTypingStatus
	if err := go_json.Unmarshal(msg.wsMessage.Payload, &incoming); err != nil {
		return err
	}

	tsp.setClientTyping(room, msg.client)

	payload, err := go_json.Marshal(outgoingTypingStatus{
		Profiles: []models.Profile{incoming.Profile},
	})
	if err != nil {
		return err
	}

	room.mu.RLock()
	for c := range room.clients {
		if c != msg.client {
			c.write <- wsMessage{
				Type:    typingStatusType,
				Payload: payload,
			}
		}
	}
	room.mu.RUnlock()

	return nil
}

func (tsp *typingStatusPlugin) handleClientLeave(room *activeRoom, client *Client) error {
	tsp.mu.Lock()
	delete(tsp.typing[room], client)
	tsp.mu.Unlock()

	return nil
}

func (tsp *typingStatusPlugin) cleanup(interval time.Duration) {
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

func (tsp *typingStatusPlugin) getTypingProfiles(room *activeRoom, client *Client) []models.Profile {
	tsp.mu.RLock()
	defer tsp.mu.RUnlock()

	clients, ok := tsp.typing[room]
	if !ok {
		return nil
	}

	var profiles []models.Profile
	for c := range clients {
		if c != client {
			profiles = append(profiles, c.profile)
		}
	}

	return profiles
}

func (tsp *typingStatusPlugin) setClientTyping(room *activeRoom, client *Client) {
	tsp.mu.Lock()
	defer tsp.mu.Unlock()

	clients, ok := tsp.typing[room]
	if !ok {
		clients = make(map[*Client]time.Time)
		tsp.typing[room] = clients
	}

	clients[client] = time.Now()
}
