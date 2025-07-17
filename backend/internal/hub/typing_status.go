package hub

import (
	"go-chat/internal/models"
	"sync"
	"time"

	go_json "github.com/goccy/go-json"
)

type TypingStatusPlugin struct {
	typing  map[*activeRoom]map[*Client]time.Time
	mu      sync.RWMutex
	timeout time.Duration
}

type TypingStatusPluginConfig struct {
	Timeout         time.Duration
	CleanupInterval time.Duration
}

func NewTypingStatusPlugin(cfg *TypingStatusPluginConfig) *TypingStatusPlugin {
	tsp := &TypingStatusPlugin{
		typing:  make(map[*activeRoom]map[*Client]time.Time),
		timeout: cfg.Timeout,
	}

	go tsp.cleanup(cfg.CleanupInterval)

	return tsp
}

func (tsp *TypingStatusPlugin) MessageType() WsMessageType {
	return TypingStatusType
}

type outgoingTypingStatus struct {
	Profiles []models.Profile `json:"profiles"`
}

func (tsp *TypingStatusPlugin) HandleClientJoin(ar *activeRoom, client *Client) error {
	typingProfiles := tsp.getTypingProfiles(ar, client)
	if typingProfiles == nil {
		return nil
	}

	ots := outgoingTypingStatus{
		Profiles: typingProfiles,
	}

	payloadBytes, err := go_json.Marshal(ots)
	if err != nil {
		return err
	}

	client.write <- WsMessage{
		Type:    TypingStatusType,
		Payload: payloadBytes,
	}

	return nil
}

type incomingTypingStatus struct {
	Profile models.Profile `json:"profile"`
}

func (tsp *TypingStatusPlugin) HandleClientMessage(ar *activeRoom, clientMessage ClientMessage) error {
	var its incomingTypingStatus
	if err := go_json.Unmarshal(clientMessage.WsMessage.Payload, &its); err != nil {
		return err
	}

	tsp.setClientTyping(ar, clientMessage)

	payloadBytes, err := go_json.Marshal(outgoingTypingStatus{
		Profiles: []models.Profile{its.Profile},
	})
	if err != nil {
		return err
	}

	ar.mu.RLock()
	for c := range ar.clients {
		if c != clientMessage.Client {
			c.write <- WsMessage{
				Type:    TypingStatusType,
				Payload: payloadBytes,
			}
		}
	}
	ar.mu.RUnlock()

	return nil
}

func (tsp *TypingStatusPlugin) HandleClientLeave(ar *activeRoom, client *Client) error {
	tsp.mu.Lock()
	delete(tsp.typing[ar], client)
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

func (tsp *TypingStatusPlugin) getTypingProfiles(ar *activeRoom, client *Client) []models.Profile {
	tsp.mu.RLock()
	defer tsp.mu.RUnlock()

	clients, ok := tsp.typing[ar]
	if !ok {
		return nil
	}

	var typingProfiles []models.Profile
	for c := range clients {
		if c != client {
			typingProfiles = append(typingProfiles, c.profile)
		}
	}

	return typingProfiles
}

func (tsp *TypingStatusPlugin) setClientTyping(ar *activeRoom, clientMessage ClientMessage) {
	tsp.mu.Lock()
	defer tsp.mu.Unlock()

	clients, ok := tsp.typing[ar]
	if !ok {
		clients = make(map[*Client]time.Time)
		tsp.typing[ar] = clients
	}

	clients[clientMessage.Client] = time.Now()
}
