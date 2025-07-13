package plugins

import (
	"go-chat/internal/types"
)

type ClientMessagePlugin interface {
	MessageType() types.WsMessageType
	HandleClientMessage(pluginService *PluginService, clientMessage types.ClientMessage) error
}

// type ClientJoinPlugin ...

// type ClientLeavePlugin ...
