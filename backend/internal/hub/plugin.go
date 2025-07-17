package hub

type ClientMessagePlugin interface {
	MessageType() WsMessageType
	HandleClientMessage(ar *activeRoom, clientMessage ClientMessage) error
}

type ClientJoinPlugin interface {
	HandleClientJoin(ar *activeRoom, client *Client) error
}

type ClientLeavePlugin interface {
	HandleClientLeave(ar *activeRoom, client *Client) error
}
