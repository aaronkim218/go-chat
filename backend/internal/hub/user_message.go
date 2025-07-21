package hub

import (
	"context"
	"time"

	"go-chat/internal/models"
	"go-chat/internal/types"

	go_json "github.com/goccy/go-json"

	"github.com/google/uuid"
)

type incomingUserMessage struct {
	Content string `json:"content"`
}

type userMessagePluginConfig struct{}

type userMessagePlugin struct{}

func newUserMessagePlugin(cfg *userMessagePluginConfig) *userMessagePlugin {
	return &userMessagePlugin{}
}

func (p *userMessagePlugin) messageType() wsMessageType {
	return userMessageType
}

func (p *userMessagePlugin) handleBroadcastMessage(room *activeRoom, msg broadcastMessage) error {
	var incoming incomingUserMessage
	if err := go_json.Unmarshal(msg.wsMessage.Payload, &incoming); err != nil {
		return err
	}

	messageId, err := uuid.NewRandom()
	if err != nil {
		return err
	}

	message := models.Message{
		Id:        messageId,
		RoomId:    room.roomId,
		Author:    msg.client.profile.UserId,
		Content:   incoming.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := room.storage.CreateMessage(context.TODO(), message); err != nil {
		return err
	}

	userMessage := types.UserMessage{
		Message:   message,
		Username:  msg.client.profile.Username,
		FirstName: msg.client.profile.FirstName,
		LastName:  msg.client.profile.LastName,
	}

	payload, err := go_json.Marshal(userMessage)
	if err != nil {
		return err
	}

	room.mu.RLock()
	for c := range room.clients {
		c.write <- wsMessage{
			Type:    userMessageType,
			Payload: payload,
		}
	}
	room.mu.RUnlock()

	return nil
}
