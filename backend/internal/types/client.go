package types

import (
	"go-chat/internal/models"

	go_json "github.com/goccy/go-json"

	"github.com/gofiber/contrib/websocket"
)

type Client struct {
	Profile models.Profile
	Conn    *websocket.Conn
	Done    chan struct{}
}

type ClientMessage struct {
	Client    *Client
	WsMessage WsMessage
}

type WsMessageType string

const (
	UserMessageType WsMessageType = "USER_MESSAGE"
)

type WsMessage struct {
	Type    WsMessageType      `json:"type"`
	Payload go_json.RawMessage `json:"payload"`
}
