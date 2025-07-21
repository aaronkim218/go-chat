package models

import (
	"fmt"
	"time"

	"go-chat/internal/constants"

	"github.com/google/uuid"
)

type Profile struct {
	UserId    uuid.UUID `json:"user_id" db:"user_id"`
	Username  string    `json:"username" db:"username"`
	FirstName string    `json:"first_name" db:"first_name"`
	LastName  string    `json:"last_name" db:"last_name"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

func (p *Profile) Validate() map[string]string {
	errMap := make(map[string]string)

	if len(p.Username) < constants.MinUsernameLength || len(p.Username) > constants.MaxUsernameLength {
		errMap["username"] = fmt.Sprintf(
			"username length must be between %d and %d",
			constants.MinUsernameLength,
			constants.MaxUsernameLength,
		)
	}

	return errMap
}
