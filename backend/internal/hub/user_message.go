package hub

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

type incomingUserMessage struct {
	Content string `json:"content"`
}

func (p *UserMessagePlugin) HandleClientMessage(ar *activeRoom, clientMessage types.ClientMessage) error {
	var ium incomingUserMessage
	if err := go_json.Unmarshal(clientMessage.WsMessage.Payload, &ium); err != nil {
		return err
	}

	messageId, err := uuid.NewRandom()
	if err != nil {
		return err
	}

	message := models.Message{
		Id:        messageId,
		RoomId:    ar.roomId,
		Author:    clientMessage.Client.Profile.UserId,
		Content:   ium.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := ar.storage.CreateMessage(context.TODO(), message); err != nil {
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

	for client := range ar.clients {
		ar.writeJobs <- types.ClientMessage{
			Client: client,
			WsMessage: types.WsMessage{
				Type:    types.UserMessageType,
				Payload: payloadBytes,
			},
		}
	}

	return nil
}
