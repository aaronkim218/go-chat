package xerrors

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type HTTPError struct {
	StatusCode int `json:"statusCode"`
	Message    any `json:"message"`
}

func (e HTTPError) Error() string {
	return fmt.Sprintf("status code: %d | message: %v", e.StatusCode, e.Message)
}

func NewHTTPError(statusCode int, err error) HTTPError {
	return HTTPError{
		StatusCode: statusCode,
		Message:    err.Error(),
	}
}

func InternalServerError() HTTPError {
	return NewHTTPError(http.StatusInternalServerError, errors.New("internal server error"))
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	var httpErr HTTPError
	if castedErr, ok := err.(HTTPError); ok {
		httpErr = castedErr
	} else {
		httpErr = InternalServerError()
	}

	slog.Error("error handling request",
		slog.String("method", c.Method()),
		slog.String("path", c.Path()),
		slog.String("error", err.Error()),
	)

	return c.Status(httpErr.StatusCode).JSON(httpErr)
}
