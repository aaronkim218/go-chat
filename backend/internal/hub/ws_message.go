package hub

import (
	go_json "github.com/goccy/go-json"
)

type wsMessage struct {
	Type    wsMessageType      `json:"type"`
	Payload go_json.RawMessage `json:"payload"`
}
