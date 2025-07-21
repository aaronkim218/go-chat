package types

import (
	"fmt"
	"time"

	"go-chat/internal/constants"
)

type PartialProfile struct {
	Username  *string   `json:"username,omitempty"`
	FirstName *string   `json:"first_name,omitempty"`
	LastName  *string   `json:"last_name,omitempty"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (pp *PartialProfile) Validate() map[string]string {
	errMap := make(map[string]string)

	if pp.Username == nil && pp.FirstName == nil && pp.LastName == nil {
		errMap["fields"] = "at least one field must be provided to update the profile"
		return errMap
	}

	if pp.Username != nil && (len(*pp.Username) < constants.MinUsernameLength || len(*pp.Username) > constants.MaxUsernameLength) {
		errMap["username"] = fmt.Sprintf(
			"username length must be between %d and %d",
			constants.MinUsernameLength,
			constants.MaxUsernameLength,
		)
	}

	return errMap
}
