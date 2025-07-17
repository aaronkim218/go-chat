package hub

import (
	go_json "github.com/goccy/go-json"
)

type ClientMessage struct {
	Client    *Client
	WsMessage WsMessage
}

type WsMessageType string

const (
	UserMessageType  WsMessageType = "USER_MESSAGE"
	PresenceType     WsMessageType = "PRESENCE"
	TypingStatusType WsMessageType = "TYPING_STATUS"
)

type WsMessage struct {
	Type    WsMessageType      `json:"type"`
	Payload go_json.RawMessage `json:"payload"`
}
