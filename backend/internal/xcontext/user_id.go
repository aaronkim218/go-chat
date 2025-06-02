package xcontext

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type userIdKey struct{}

func SetUserId(c *fiber.Ctx, userId uuid.UUID) {
	c.Locals(userIdKey{}, userId)
}

func GetUserId(c *fiber.Ctx) (uuid.UUID, error) {
	userId, ok := c.Locals(userIdKey{}).(uuid.UUID)
	if !ok {
		return uuid.UUID{}, fmt.Errorf("failed to retrieve user id from fiber context locals")
	}

	return userId, nil
}
