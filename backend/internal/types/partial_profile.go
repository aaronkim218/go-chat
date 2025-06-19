package types

import (
	"fmt"
	"go-chat/internal/constants"
)

type PartialProfile struct {
	Username  *string `json:"username"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
}

func (pp *PartialProfile) Validate() map[string]string {
	errMap := make(map[string]string)

	if pp.Username != nil && (len(*pp.Username) < constants.MinUsernameLength || len(*pp.Username) > constants.MaxUsernameLength) {
		errMap["username"] = fmt.Sprintf(
			"username length must be between %d and %d",
			constants.MinUsernameLength,
			constants.MaxUsernameLength,
		)
	}

	return errMap
}
