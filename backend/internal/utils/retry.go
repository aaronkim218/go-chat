package utils

import (
	"context"
	"errors"
	"go-chat/internal/types"
	"time"
)

const (
	retries       int           = 2
	retryInterval time.Duration = 100 * time.Millisecond
)

func Retry[T any](ctx context.Context, fn func(ctx context.Context) (T, error)) (T, error) {
	var zero T
	var joinedErr error

	for i := range retries {
		result, err := fn(ctx)
		if err == nil {
			return result, nil
		}

		if nre, ok := err.(*types.NonRetryableError); ok {
			return zero, nre.Err
		}

		joinedErr = errors.Join(joinedErr, err)
		if i < retries-1 {
			select {
			case <-ctx.Done():
				return zero, ctx.Err()
			case <-time.After(retryInterval):
			}
		}
	}

	return zero, joinedErr
}

func CreateNonRetryableError(err error) *types.NonRetryableError {
	return &types.NonRetryableError{
		Err: err,
	}
}
