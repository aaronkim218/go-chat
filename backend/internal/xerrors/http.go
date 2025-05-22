package xerrors

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type HTTPError struct {
	StatusCode int `json:"status_code"`
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

func BadRequestError(message string) HTTPError {
	return NewHTTPError(http.StatusBadRequest, errors.New(message))
}

func UnauthorizedError() HTTPError {
	return NewHTTPError(http.StatusUnauthorized, errors.New("unauthorized"))
}

func NotFoundError(entity string, key string, value string) HTTPError {
	return NewHTTPError(http.StatusNotFound, fmt.Errorf("%s with %s=%s not found", entity, key, value))
}

func InvalidJSON() HTTPError {
	return NewHTTPError(http.StatusBadRequest, errors.New("invalid JSON request data"))
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	var httpErr HTTPError

	switch e := err.(type) {
	case HTTPError:
		httpErr = e
	case *fiber.Error:
		httpErr = NewHTTPError(e.Code, errors.New(e.Message))
	default:
		httpErr = InternalServerError()
	}

	slog.Error("error handling request",
		slog.String("method", c.Method()),
		slog.String("path", c.Path()),
		slog.String("error", err.Error()),
	)

	return c.Status(httpErr.StatusCode).JSON(httpErr)
}
