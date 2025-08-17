package handlers

import (
	"context"
	"log/slog"

	"go-chat/internal/utils"

	"github.com/aaronkim218/eventsocket"

	"github.com/gofiber/contrib/websocket"
	"github.com/golang-jwt/jwt/v5"
)

func (hs *HandlerService) HandleUserConnection(conn *websocket.Conn) {
	success := false

	defer func() {
		if !success {
			if err := conn.Close(); err != nil {
				hs.logger.Error("Error closing connection", slog.String("err", err.Error()))
			}
		}
	}()

	_, tokenBytes, err := conn.ReadMessage()
	if err != nil {
		hs.logger.Error("Failed to read JWT", slog.String("err", err.Error()))
		return
	}

	token, err := jwt.Parse(
		string(tokenBytes),
		func(t *jwt.Token) (any, error) {
			return []byte(hs.jwtSecret), nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}),
	)
	if err != nil {
		hs.logger.Error("Failed to parse token",
			slog.String("err", err.Error()),
			slog.String("msg", string(tokenBytes)),
		)
		return
	}

	uid, err := utils.GetUserIdFromToken(token)
	if err != nil {
		hs.logger.Error("Failed to get user id from token", slog.String("err", err.Error()))
		return
	}

	profile, err := hs.storage.GetProfileByUserId(context.Background(), uid)
	if err != nil {
		hs.logger.Error("Failed to get profile",
			slog.String("err", err.Error()),
			slog.String("userId", uid.String()),
		)
		return
	}

	client, err := hs.eventsocket.CreateClient(&eventsocket.CreateClientConfig{
		ID:   uid.String(),
		Conn: conn,
	})
	if err != nil {
		hs.logger.Error("Failed to create client",
			slog.String("err", err.Error()),
			slog.String("userId", uid.String()),
		)
		return
	}

	hs.pluginsContainer.RegisterClient(client, profile)

	success = true

	<-client.Done()
}
