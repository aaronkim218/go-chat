package models

import "github.com/google/uuid"

type Profile struct {
	UserId    uuid.UUID `json:"user_id" db:"user_id"`
	Username  string    `json:"username" db:"username"`
	FirstName *string   `json:"first_name" db:"first_name"`
	LastName  *string   `json:"last_name" db:"last_name"`
}
