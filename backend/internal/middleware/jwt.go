package middleware

import (
	"fmt"
	"go-chat/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type userIdKey struct{}

func SetUserId() fiber.Handler {
	return func(c *fiber.Ctx) error {
		token, ok := c.Locals("user").(*jwt.Token)
		if !ok {
			return fmt.Errorf("failed to retrieve token from fiber context locals")
		}

		userId, err := utils.GetUserIdFromToken(token)
		if err != nil {
			return err
		}

		c.Locals(userIdKey{}, userId)

		return c.Next()
	}
}

func GetUserId(c *fiber.Ctx) (uuid.UUID, error) {
	userId, ok := c.Locals(userIdKey{}).(uuid.UUID)
	if !ok {
		return uuid.UUID{}, fmt.Errorf("failed to retrieve user id from fiber context locals")
	}

	return userId, nil
}
