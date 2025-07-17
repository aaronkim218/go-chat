package hub

import (
	"go-chat/internal/models"

	go_json "github.com/goccy/go-json"
)

type PresencePlugin struct{}

type PresencePluginConfig struct{}

func NewPresencePlugin(cfg *PresencePluginConfig) *PresencePlugin {
	return &PresencePlugin{}
}

func (pp *PresencePlugin) MessageType() WsMessageType {
	return UserMessageType
}

type action string

const (
	join  action = "JOIN"
	leave action = "LEAVE"
)

type outgoingPresence struct {
	Profiles []models.Profile `json:"profiles"`
	Action   action           `json:"action"`
}

func (pp *PresencePlugin) HandleClientJoin(ar *activeRoom, client *Client) error {
	var activeProfiles []models.Profile
	ar.mu.RLock()
	for c := range ar.clients {
		if c != client {
			activeProfiles = append(activeProfiles, c.profile)
		}
	}
	ar.mu.RUnlock()

	op := outgoingPresence{
		Profiles: activeProfiles,
		Action:   join,
	}

	payloadBytes, err := go_json.Marshal(op)
	if err != nil {
		return err
	}

	client.write <- WsMessage{
		Type:    PresenceType,
		Payload: payloadBytes,
	}

	op = outgoingPresence{
		Profiles: []models.Profile{client.profile},
		Action:   join,
	}

	payloadBytes, err = go_json.Marshal(op)
	if err != nil {
		return err
	}

	ar.mu.RLock()
	for c := range ar.clients {
		if c != client {
			c.write <- WsMessage{
				Type:    PresenceType,
				Payload: payloadBytes,
			}
		}
	}
	ar.mu.RUnlock()

	return nil
}

func (pp *PresencePlugin) HandleClientLeave(ar *activeRoom, client *Client) error {
	op := outgoingPresence{
		Profiles: []models.Profile{client.profile},
		Action:   leave,
	}

	payloadBytes, err := go_json.Marshal(op)
	if err != nil {
		return err
	}

	ar.mu.RLock()
	for c := range ar.clients {
		c.write <- WsMessage{
			Type:    PresenceType,
			Payload: payloadBytes,
		}
	}
	ar.mu.RUnlock()

	return nil
}
