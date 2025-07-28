package plugins

import (
	"go-chat/internal/models"

	"github.com/aaronkim218/hubsocket"
	go_json "github.com/goccy/go-json"
)

const (
	presenceType hubsocket.WsMessageType = "PRESENCE"
	join         action                  = "JOIN"
	leave        action                  = "LEAVE"
)

type action string

type outgoingPresence struct {
	Profiles []models.Profile `json:"profiles"`
	Action   action           `json:"action"`
}

type PresencePluginConfig struct{}

type PresencePlugin struct{}

func NewPresencePlugin(cfg *PresencePluginConfig) *PresencePlugin {
	return &PresencePlugin{}
}

func (pp *PresencePlugin) HandleClientJoin(room *hubsocket.ActiveRoom[models.Profile], client *hubsocket.Client[models.Profile]) error {
	var activeProfiles []models.Profile
	room.Mu.RLock()
	for c := range room.Clients {
		if c != client {
			activeProfiles = append(activeProfiles, c.Metadata)
		}
	}
	room.Mu.RUnlock()

	outgoing := outgoingPresence{
		Profiles: activeProfiles,
		Action:   join,
	}

	payload, err := go_json.Marshal(outgoing)
	if err != nil {
		return err
	}

	client.Write <- hubsocket.WsMessage{
		Type:    presenceType,
		Payload: payload,
	}

	outgoing = outgoingPresence{
		Profiles: []models.Profile{client.Metadata},
		Action:   join,
	}

	payload, err = go_json.Marshal(outgoing)
	if err != nil {
		return err
	}

	room.Mu.RLock()
	for c := range room.Clients {
		if c != client {
			c.Write <- hubsocket.WsMessage{
				Type:    presenceType,
				Payload: payload,
			}
		}
	}
	room.Mu.RUnlock()

	return nil
}

func (pp *PresencePlugin) HandleClientLeave(room *hubsocket.ActiveRoom[models.Profile], client *hubsocket.Client[models.Profile]) error {
	payload, err := go_json.Marshal(outgoingPresence{
		Profiles: []models.Profile{client.Metadata},
		Action:   leave,
	})
	if err != nil {
		return err
	}

	room.Mu.RLock()
	for c := range room.Clients {
		c.Write <- hubsocket.WsMessage{
			Type:    presenceType,
			Payload: payload,
		}
	}
	room.Mu.RUnlock()

	return nil
}
