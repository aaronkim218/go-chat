package plugins

import (
	"fmt"
	"go-chat/internal/storage"
	"go-chat/internal/types"
	"log/slog"

	"github.com/google/uuid"
)

type PluginRegistry struct {
	plugins map[types.WsMessageType]ClientMessagePlugin
}

type PluginRegistryConfig struct{}

type PluginService struct {
	RoomId    uuid.UUID
	Storage   storage.Storage
	WriteJobs chan<- types.ClientMessage
	Logger    *slog.Logger
	Clients   map[*types.Client]struct{}
}

func NewPluginRegistry(cfg *PluginRegistryConfig) *PluginRegistry {
	return &PluginRegistry{
		plugins: make(map[types.WsMessageType]ClientMessagePlugin),
	}
}

func (pr *PluginRegistry) Register(plugin ClientMessagePlugin) {
	pr.plugins[plugin.MessageType()] = plugin
}

func (pr *PluginRegistry) HandleClientMessage(pluginService *PluginService, clientMessage types.ClientMessage) error {
	plugin, exists := pr.plugins[clientMessage.WsMessage.Type]
	if !exists {
		return fmt.Errorf("no plugins registered for message type: %s", string(clientMessage.WsMessage.Type))
	}

	return plugin.HandleClientMessage(pluginService, clientMessage)
}
