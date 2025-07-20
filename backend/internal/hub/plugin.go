package hub

type clientJoinPlugin interface {
	handleClientJoin(*activeRoom, *Client) error
}

type broadcastMessagePlugin interface {
	messageType() wsMessageType
	handleBroadcastMessage(*activeRoom, broadcastMessage) error
}

type clientLeavePlugin interface {
	handleClientLeave(*activeRoom, *Client) error
}
