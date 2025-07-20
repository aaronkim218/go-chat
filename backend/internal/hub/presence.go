package hub

import (
	"go-chat/internal/models"

	go_json "github.com/goccy/go-json"
)

const (
	join  action = "JOIN"
	leave action = "LEAVE"
)

type action string

type outgoingPresence struct {
	Profiles []models.Profile `json:"profiles"`
	Action   action           `json:"action"`
}

type presencePluginConfig struct{}

type presencePlugin struct{}

func newPresencePlugin(cfg *presencePluginConfig) *presencePlugin {
	return &presencePlugin{}
}

func (pp *presencePlugin) handleClientJoin(room *activeRoom, client *Client) error {
	var activeProfiles []models.Profile
	room.mu.RLock()
	for c := range room.clients {
		if c != client {
			activeProfiles = append(activeProfiles, c.profile)
		}
	}
	room.mu.RUnlock()

	outgoing := outgoingPresence{
		Profiles: activeProfiles,
		Action:   join,
	}

	payload, err := go_json.Marshal(outgoing)
	if err != nil {
		return err
	}

	client.write <- wsMessage{
		Type:    presenceType,
		Payload: payload,
	}

	outgoing = outgoingPresence{
		Profiles: []models.Profile{client.profile},
		Action:   join,
	}

	payload, err = go_json.Marshal(outgoing)
	if err != nil {
		return err
	}

	room.mu.RLock()
	for c := range room.clients {
		if c != client {
			c.write <- wsMessage{
				Type:    presenceType,
				Payload: payload,
			}
		}
	}
	room.mu.RUnlock()

	return nil
}

func (pp *presencePlugin) handleClientLeave(room *activeRoom, cl *Client) error {
	payload, err := go_json.Marshal(outgoingPresence{
		Profiles: []models.Profile{cl.profile},
		Action:   leave,
	})
	if err != nil {
		return err
	}

	room.mu.RLock()
	for c := range room.clients {
		c.write <- wsMessage{
			Type:    presenceType,
			Payload: payload,
		}
	}
	room.mu.RUnlock()

	return nil
}
