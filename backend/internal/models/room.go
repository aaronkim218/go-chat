package models

import (
	"time"

	"github.com/google/uuid"
)

type Room struct {
	Id        uuid.UUID `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Host      uuid.UUID `json:"host" db:"host"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
