package models

import "github.com/google/uuid"

type Room struct {
	Id   uuid.UUID `json:"id"`
	Host uuid.UUID `json:"host"`
}
