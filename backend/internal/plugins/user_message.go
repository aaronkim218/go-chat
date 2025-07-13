package plugins

import (
	"context"
	"go-chat/internal/models"
	"go-chat/internal/types"
	"time"

	go_json "github.com/goccy/go-json"

	"github.com/google/uuid"
)

type UserMessagePlugin struct{}

type UserMessagePluginConfig struct{}

func NewUserMessagePlugin(cfg *UserMessagePluginConfig) *UserMessagePlugin {
	return &UserMessagePlugin{}
}

func (p *UserMessagePlugin) MessageType() types.WsMessageType {
	return types.UserMessageType
}

type broadcastUserMessage struct {
	Content string `json:"content"`
}

func (p *UserMessagePlugin) HandleClientMessage(pluginService *PluginService, clientMessage types.ClientMessage) error {
	var bum broadcastUserMessage
	if err := go_json.Unmarshal(clientMessage.WsMessage.Payload, &bum); err != nil {
		return err
	}

	messageId, err := uuid.NewRandom()
	if err != nil {
		return err
	}

	message := models.Message{
		Id:        messageId,
		RoomId:    pluginService.RoomId,
		Author:    clientMessage.Client.Profile.UserId,
		Content:   bum.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := pluginService.Storage.CreateMessage(context.TODO(), message); err != nil {
		return err
	}

	userMessage := types.UserMessage{
		Message:   message,
		Username:  clientMessage.Client.Profile.Username,
		FirstName: clientMessage.Client.Profile.FirstName,
		LastName:  clientMessage.Client.Profile.LastName,
	}

	payloadBytes, err := go_json.Marshal(userMessage)
	if err != nil {
		return err
	}

	for client := range pluginService.Clients {
		pluginService.WriteJobs <- types.ClientMessage{
			Client: client,
			WsMessage: types.WsMessage{
				Type:    types.UserMessageType,
				Payload: payloadBytes,
			},
		}
	}

	return nil
}
