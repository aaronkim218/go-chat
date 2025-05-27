package models

import "github.com/google/uuid"

type Profile struct {
	UserId uuid.UUID `json:"user_id" db:"user_id"`
}
