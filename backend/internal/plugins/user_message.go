package plugins

import (
	"context"
	"time"

	"go-chat/internal/models"
	"go-chat/internal/storage"
	"go-chat/internal/types"

	"github.com/aaronkim218/hubsocket"
	go_json "github.com/goccy/go-json"

	"github.com/google/uuid"
)

const userMessageType hubsocket.WsMessageType = "USER_MESSAGE"

type incomingUserMessage struct {
	Content string `json:"content"`
}

type UserMessagePluginConfig struct {
	Storage storage.Storage
}

type UserMessagePlugin struct {
	storage storage.Storage
}

func NewUserMessagePlugin(cfg *UserMessagePluginConfig) *UserMessagePlugin {
	return &UserMessagePlugin{
		storage: cfg.Storage,
	}
}

func (ump *UserMessagePlugin) MessageType() hubsocket.WsMessageType {
	return userMessageType
}

func (ump *UserMessagePlugin) HandleBroadcastMessage(room *hubsocket.ActiveRoom[models.Profile], msg hubsocket.BroadcastMessage[models.Profile]) error {
	var incoming incomingUserMessage
	if err := go_json.Unmarshal(msg.WsMessage.Payload, &incoming); err != nil {
		return err
	}

	messageId, err := uuid.NewRandom()
	if err != nil {
		return err
	}

	message := models.Message{
		Id:        messageId,
		RoomId:    room.RoomId,
		Author:    msg.Client.Metadata.UserId,
		Content:   incoming.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := ump.storage.CreateMessage(context.TODO(), message); err != nil {
		return err
	}

	userMessage := types.UserMessage{
		Message:   message,
		Username:  msg.Client.Metadata.Username,
		FirstName: msg.Client.Metadata.FirstName,
		LastName:  msg.Client.Metadata.LastName,
	}

	payload, err := go_json.Marshal(userMessage)
	if err != nil {
		return err
	}

	room.Mu.RLock()
	for c := range room.Clients {
		c.Write <- hubsocket.WsMessage{
			Type:    userMessageType,
			Payload: payload,
		}
	}
	room.Mu.RUnlock()

	return nil
}
