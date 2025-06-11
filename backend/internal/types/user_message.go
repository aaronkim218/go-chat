package types

import "go-chat/internal/models"

type UserMessage struct {
	models.Message
	Username  string `json:"username" db:"username"`
	FirstName string `json:"first_name" db:"first_name"`
	LastName  string `json:"last_name" db:"last_name"`
}
