package handlers

import (
	"log/slog"

	"go-chat/internal/plugins"
	"go-chat/internal/storage"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/aaronkim218/eventsocket"
	"github.com/golang-jwt/jwt/v5"

	"github.com/gofiber/fiber/v2"
)

type HandlerService struct {
	storage          storage.Storage
	keyFunc          jwt.Keyfunc
	logger           *slog.Logger
	fiberStorage     fiber.Storage
	eventsocket      *eventsocket.Eventsocket
	pluginsContainer *plugins.Container
}

type HandlerServiceConfig struct {
	Storage          storage.Storage
	JwksURL          string
	Logger           *slog.Logger
	FiberStorage     fiber.Storage
	Eventsocket      *eventsocket.Eventsocket
	PluginsContainer *plugins.Container
}

func NewService(cfg *HandlerServiceConfig) *HandlerService {
	jwks, err := keyfunc.Get(cfg.JwksURL, keyfunc.Options{})
	if err != nil {
		panic("failed to fetch JWKS: " + err.Error())
	}

	return &HandlerService{
		storage:          cfg.Storage,
		keyFunc:          jwks.Keyfunc,
		logger:           cfg.Logger,
		fiberStorage:     cfg.FiberStorage,
		eventsocket:      cfg.Eventsocket,
		pluginsContainer: cfg.PluginsContainer,
	}
}
