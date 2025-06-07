package types

import (
	"context"
	"go-chat/internal/models"

	"github.com/gofiber/contrib/websocket"
)

type Client struct {
	Profile models.Profile
	Conn    *websocket.Conn
	Ctx     context.Context
	Cancel  context.CancelFunc
}
