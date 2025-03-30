package types

import (
	"context"

	"github.com/gofiber/contrib/websocket"
)

type Client struct {
	Conn   *websocket.Conn
	Ctx    context.Context
	Cancel context.CancelFunc
}
