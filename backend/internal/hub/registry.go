package hub

import (
	"errors"
	"fmt"
	"go-chat/internal/types"
)

type PluginRegistry struct {
	clientMessagePlugins map[types.WsMessageType][]ClientMessagePlugin
	clientJoinPlugins    []ClientJoinPlugin
	clientLeavePlugins   []ClientLeavePlugin
}

type PluginRegistryConfig struct{}

func NewPluginRegistry(cfg *PluginRegistryConfig) *PluginRegistry {
	return &PluginRegistry{
		clientMessagePlugins: make(map[types.WsMessageType][]ClientMessagePlugin),
		clientJoinPlugins:    make([]ClientJoinPlugin, 0),
		clientLeavePlugins:   make([]ClientLeavePlugin, 0),
	}
}

func (pr *PluginRegistry) RegisterClientMessagePlugin(plugin ClientMessagePlugin) {
	messageType := plugin.MessageType()
	pr.clientMessagePlugins[messageType] = append(pr.clientMessagePlugins[messageType], plugin)
}

func (pr *PluginRegistry) RegisterClientJoinPlugin(plugin ClientJoinPlugin) {
	pr.clientJoinPlugins = append(pr.clientJoinPlugins, plugin)
}

func (pr *PluginRegistry) RegisterClientLeavePlugin(plugin ClientLeavePlugin) {
	pr.clientLeavePlugins = append(pr.clientLeavePlugins, plugin)
}

func (pr *PluginRegistry) HandleClientMessage(ar *activeRoom, clientMessage types.ClientMessage) error {
	plugins, exists := pr.clientMessagePlugins[clientMessage.WsMessage.Type]
	if !exists {
		return fmt.Errorf("no plugins registered for message type: %s", string(clientMessage.WsMessage.Type))
	}

	var joinedErr error
	for _, plugin := range plugins {
		if err := plugin.HandleClientMessage(ar, clientMessage); err != nil {
			joinedErr = errors.Join(joinedErr, err)
		}
	}

	return joinedErr
}

func (pr *PluginRegistry) HandleClientJoin(ar *activeRoom, client *types.Client) error {
	var joinedErr error
	for _, plugin := range pr.clientJoinPlugins {
		if err := plugin.HandleClientJoin(ar, client); err != nil {
			joinedErr = errors.Join(joinedErr, err)
		}
	}

	return joinedErr
}

func (pr *PluginRegistry) HandleClientLeave(ar *activeRoom, client *types.Client) error {
	var joinedErr error
	for _, plugin := range pr.clientLeavePlugins {
		if err := plugin.HandleClientLeave(ar, client); err != nil {
			joinedErr = errors.Join(joinedErr, err)
		}
	}

	return joinedErr
}
