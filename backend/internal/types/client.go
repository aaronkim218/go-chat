package types

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/google/uuid"
)

type Client struct {
	Id   uuid.UUID
	Conn *websocket.Conn
}
