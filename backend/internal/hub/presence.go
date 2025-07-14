package hub

import (
	"go-chat/internal/models"
	"go-chat/internal/types"

	go_json "github.com/goccy/go-json"
)

type PresencePlugin struct{}

type PresencePluginConfig struct{}

func NewPresencePlugin(cfg *PresencePluginConfig) *PresencePlugin {
	return &PresencePlugin{}
}

func (pp *PresencePlugin) MessageType() types.WsMessageType {
	return types.UserMessageType
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

func (pp *PresencePlugin) HandleClientJoin(ar *activeRoom, client *types.Client) error {
	var activeProfiles []models.Profile
	for c := range ar.clients {
		activeProfiles = append(activeProfiles, c.Profile)
	}

	op := outgoingPresence{
		Profiles: activeProfiles,
		Action:   join,
	}

	payloadBytes, err := go_json.Marshal(op)
	if err != nil {
		return err
	}

	for client := range ar.clients {
		ar.writeJobs <- types.ClientMessage{
			Client: client,
			WsMessage: types.WsMessage{
				Type:    types.PresenceType,
				Payload: payloadBytes,
			},
		}
	}

	return nil
}

func (pp *PresencePlugin) HandleClientLeave(ar *activeRoom, client *types.Client) error {
	op := outgoingPresence{
		Profiles: []models.Profile{client.Profile},
		Action:   leave,
	}

	payloadBytes, err := go_json.Marshal(op)
	if err != nil {
		return err
	}

	for client := range ar.clients {
		ar.writeJobs <- types.ClientMessage{
			Client: client,
			WsMessage: types.WsMessage{
				Type:    types.PresenceType,
				Payload: payloadBytes,
			},
		}
	}

	return nil
}
