package main

// @title go-chat API
// @version 0.1
// @description test
import (
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"go-chat/internal/constants"
	"go-chat/internal/models"
	"go-chat/internal/plugins"
	"go-chat/internal/server"
	"go-chat/internal/settings"
	"go-chat/internal/storage"
	"go-chat/internal/storage/postgres"
	"go-chat/internal/utils"

	"github.com/aaronkim218/hubsocket"
	"github.com/gofiber/storage/memory/v2"

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

	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: utils.MustParseSlogLevel(settings.Log.Level),
	})))

	postgres := postgres.New(&postgres.Config{
		DbUrl: settings.Storage.DbUrl,
	})

	mem := memory.New()

	hub := hubsocket.New(&hubsocket.Config[models.Profile]{
		Workers: settings.Hub.Workers,
		Logger: slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: utils.MustParseSlogLevel(settings.Hub.LogLevel),
		})),
		StatsInterval:   constants.HubStatsInterval,
		CleanupInterval: constants.HubCleanupInterval,
		PluginRegistry:  createPluginRegistry(postgres),
	})

	app := server.New(&server.Config{
		Storage:   postgres,
		Hub:       hub,
		JwtSecret: settings.Jwt.Secret,
		Logger: slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: utils.MustParseSlogLevel(settings.Server.LogLevel),
		})),
		FiberStorage: mem,
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

func createPluginRegistry(storage storage.Storage) *hubsocket.PluginRegistry[models.Profile] {
	pluginRegistry := hubsocket.NewPluginRegistry[models.Profile](&hubsocket.PluginRegistryConfig{})

	presence := plugins.NewPresencePlugin(&plugins.PresencePluginConfig{})
	typingStatus := plugins.NewTypingStatusPlugin(&plugins.TypingStatusPluginConfig{
		Timeout:         constants.TypingStatusTimeout,
		CleanupInterval: constants.TypingStatusCleanupInterval,
	})
	userMessage := plugins.NewUserMessagePlugin(&plugins.UserMessagePluginConfig{
		Storage: storage,
	})

	pluginRegistry.RegisterClientJoinPlugin(presence)
	pluginRegistry.RegisterClientJoinPlugin(typingStatus)

	pluginRegistry.RegisterBroadcastMessagePlugin(userMessage)
	pluginRegistry.RegisterBroadcastMessagePlugin(typingStatus)

	pluginRegistry.RegisterClientLeavePlugin(presence)
	pluginRegistry.RegisterClientLeavePlugin(typingStatus)

	return pluginRegistry
}
