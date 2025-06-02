package middleware

import (
	"fmt"
	"go-chat/internal/constants"
	"go-chat/internal/utils"
	"go-chat/internal/xcontext"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func SetUserId() fiber.Handler {
	return func(c *fiber.Ctx) error {
		token, ok := c.Locals(constants.TokenKey).(*jwt.Token)
		if !ok {
			return fmt.Errorf("failed to retrieve token from fiber context locals")
		}

		userId, err := utils.GetUserIdFromToken(token)
		if err != nil {
			return err
		}

		xcontext.SetUserId(c, userId)

		return c.Next()
	}
}
