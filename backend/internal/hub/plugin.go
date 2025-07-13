package hub

import (
	"go-chat/internal/types"
)

type ClientMessagePlugin interface {
	MessageType() types.WsMessageType
	HandleClientMessage(ar *activeRoom, clientMessage types.ClientMessage) error
}

type ClientJoinPlugin interface {
	HandleClientJoin(ar *activeRoom, client *types.Client) error
}

type ClientLeavePlugin interface {
	HandleClientLeave(ar *activeRoom, client *types.Client) error
}
