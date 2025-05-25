package types

import (
	"context"

	"github.com/gofiber/contrib/websocket"
	"github.com/google/uuid"
)

type Client struct {
	UserId uuid.UUID
	Conn   *websocket.Conn
	Ctx    context.Context
	Cancel context.CancelFunc
}
