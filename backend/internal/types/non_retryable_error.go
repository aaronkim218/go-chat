package types

import "fmt"

type NonRetryableError struct {
	Err error
}

func (nre *NonRetryableError) Error() string {
	return fmt.Sprintf("non retryable error: %s", nre.Err.Error())
}
