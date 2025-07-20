package hub

type broadcastMessage struct {
	client    *Client
	wsMessage wsMessage
}
