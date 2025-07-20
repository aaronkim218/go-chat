package hub

import (
	"go-chat/internal/models"
	"log/slog"

	"github.com/gofiber/contrib/websocket"
)

type ClientConfig struct {
	Profile models.Profile
	Conn    *websocket.Conn
}

type Client struct {
	profile models.Profile
	conn    *websocket.Conn
	write   chan wsMessage
	done    chan struct{}
}

func NewClient(cfg *ClientConfig) *Client {
	c := &Client{
		profile: cfg.Profile,
		conn:    cfg.Conn,
		write:   make(chan wsMessage),
		done:    make(chan struct{}),
	}

	go c.handleWriteClient()

	return c
}

func (c *Client) Done() <-chan struct{} {
	return c.done
}

func (c *Client) handleWriteClient() {
	for wsm := range c.write {
		if err := c.conn.WriteJSON(wsm); err != nil {
			slog.Error("Error writing message to client. closing connection", slog.String("err", err.Error()))
			c.closeConn()
			return
		}
	}
}

func (c *Client) closeConn() {
	if err := c.conn.Close(); err != nil {
		slog.Error("Error closing conn", slog.String("err", err.Error()))
	}
}
