package hub

type wsMessageType string

const (
	userMessageType  wsMessageType = "USER_MESSAGE"
	presenceType     wsMessageType = "PRESENCE"
	typingStatusType wsMessageType = "TYPING_STATUS"
)
