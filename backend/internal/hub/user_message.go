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

func (p *UserMessagePlugin) MessageType() WsMessageType {
	return UserMessageType
}

type incomingUserMessage struct {
	Content string `json:"content"`
}

func (p *UserMessagePlugin) HandleClientMessage(ar *activeRoom, clientMessage ClientMessage) error {
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
		Author:    clientMessage.Client.profile.UserId,
		Content:   ium.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := ar.storage.CreateMessage(context.TODO(), message); err != nil {
		return err
	}

	userMessage := types.UserMessage{
		Message:   message,
		Username:  clientMessage.Client.profile.Username,
		FirstName: clientMessage.Client.profile.FirstName,
		LastName:  clientMessage.Client.profile.LastName,
	}

	payloadBytes, err := go_json.Marshal(userMessage)
	if err != nil {
		return err
	}

	ar.mu.RLock()
	for c := range ar.clients {
		c.write <- WsMessage{
			Type:    UserMessageType,
			Payload: payloadBytes,
		}
	}
	ar.mu.RUnlock()

	return nil
}
