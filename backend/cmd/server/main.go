package main

import (
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"go-chat/internal/hub"
	"go-chat/internal/server"
	"go-chat/internal/settings"
	"go-chat/internal/storage/postgres"
	"go-chat/internal/utils"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		slog.Error("failed to load .env file", "error", err)
		os.Exit(1)
	}

	settings, err := settings.Load()
	if err != nil {
		slog.Error("failed to load settings", "error", err)
		os.Exit(1)
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: utils.ParseSlogLevel(settings.Log.Level),
	}))

	slog.SetDefault(logger)

	postgres := postgres.New(&postgres.Config{
		DbUrl: settings.Storage.DbUrl,
	})

	hubLogger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: utils.ParseSlogLevel(settings.Hub.LogLevel),
	}))

	hub := hub.New(&hub.Config{
		Storage: postgres,
		Workers: settings.Hub.Workers,
		Logger:  hubLogger,
	})

	serverLogger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: utils.ParseSlogLevel(settings.Server.LogLevel),
	}))

	app := server.New(&server.Config{
		Storage:   postgres,
		Hub:       hub,
		JwtSecret: settings.Jwt.Secret,
		Logger:    serverLogger,
	})

	go func() {
		if err := app.Listen(":" + settings.Server.Port); err != nil {
			slog.Error(
				"failed to start server",
				slog.String("error", err.Error()),
			)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	<-quit
	slog.Info("shutting down server")

	if err := app.Shutdown(); err != nil {
		slog.Error(
			"failed to shutdown server",
			slog.String("error", err.Error()))
	}

	slog.Info("server shutdown")
}
