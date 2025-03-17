package models

import (
	"time"

	"github.com/google/uuid"
)

type Message struct {
	Id        uuid.UUID `json:"id"`
	RoomId    uuid.UUID `json:"room_id"`
	CreatedAt time.Time `json:"created_at"`
	Author    uuid.UUID `json:"author"`
	Content   string    `json:"content"`
}
