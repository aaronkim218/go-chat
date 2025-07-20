package hub

import (
	"errors"
	"fmt"
)

type pluginRegistryConfig struct{}

type pluginRegistry struct {
	broadcastMessagePlugins map[wsMessageType][]broadcastMessagePlugin
	clientJoinPlugins       []clientJoinPlugin
	clientLeavePlugins      []clientLeavePlugin
}

func newPluginRegistry(cfg *pluginRegistryConfig) *pluginRegistry {
	return &pluginRegistry{
		broadcastMessagePlugins: make(map[wsMessageType][]broadcastMessagePlugin),
		clientJoinPlugins:       make([]clientJoinPlugin, 0),
		clientLeavePlugins:      make([]clientLeavePlugin, 0),
	}
}

func (pr *pluginRegistry) registerClientJoinPlugin(plugin clientJoinPlugin) {
	pr.clientJoinPlugins = append(pr.clientJoinPlugins, plugin)
}

func (pr *pluginRegistry) registerBroadcastMessagePlugin(plugin broadcastMessagePlugin) {
	messageType := plugin.messageType()
	pr.broadcastMessagePlugins[messageType] = append(pr.broadcastMessagePlugins[messageType], plugin)
}

func (pr *pluginRegistry) registerClientLeavePlugin(plugin clientLeavePlugin) {
	pr.clientLeavePlugins = append(pr.clientLeavePlugins, plugin)
}

func (pr *pluginRegistry) handleClientJoin(room *activeRoom, client *Client) error {
	var joinedErr error
	for _, plugin := range pr.clientJoinPlugins {
		if err := plugin.handleClientJoin(room, client); err != nil {
			joinedErr = errors.Join(joinedErr, err)
		}
	}

	return joinedErr
}

func (pr *pluginRegistry) handleBroadcastMessage(room *activeRoom, msg broadcastMessage) error {
	plugins, ok := pr.broadcastMessagePlugins[msg.wsMessage.Type]
	if !ok {
		return fmt.Errorf("no plugins registered for message type: %s", string(msg.wsMessage.Type))
	}

	var joinedErr error
	for _, plugin := range plugins {
		if err := plugin.handleBroadcastMessage(room, msg); err != nil {
			joinedErr = errors.Join(joinedErr, err)
		}
	}

	return joinedErr
}

func (pr *pluginRegistry) handleClientLeave(room *activeRoom, client *Client) error {
	var joinedErr error
	for _, plugin := range pr.clientLeavePlugins {
		if err := plugin.handleClientLeave(room, client); err != nil {
			joinedErr = errors.Join(joinedErr, err)
		}
	}

	return joinedErr
}
