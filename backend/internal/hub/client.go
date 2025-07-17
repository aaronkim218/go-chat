package hub

import (
	"go-chat/internal/models"
	"log/slog"

	"github.com/gofiber/contrib/websocket"
)

type Client struct {
	profile models.Profile
	conn    *websocket.Conn
	write   chan WsMessage
	done    chan struct{}
}

type ClientConfig struct {
	Profile models.Profile
	Conn    *websocket.Conn
}

func NewClient(cfg *ClientConfig) *Client {
	c := &Client{
		profile: cfg.Profile,
		conn:    cfg.Conn,
		write:   make(chan WsMessage),
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
			slog.Error(
				"error writing message to client. closing connection",
				slog.String("ip", c.conn.IP()),
				slog.String("error", err.Error()),
			)
			c.closeConn()
			return
		}
	}
}

func (c *Client) closeConn() {
	if err := c.conn.Close(); err != nil {
		slog.Error("error closing conn", slog.String("error", err.Error()))
	}
}
