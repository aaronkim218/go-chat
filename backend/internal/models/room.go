package models

import "github.com/google/uuid"

type Room struct {
	Id   uuid.UUID `json:"id" db:"id"`
	Host uuid.UUID `json:"host" db:"host"`
}
