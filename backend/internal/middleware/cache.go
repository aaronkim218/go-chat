package middleware

import (
	"go-chat/internal/constants"

	"github.com/gofiber/fiber/v2"
)

func SetCacheHeaders() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if _, ok := constants.CacheableRoutes[c.Path()]; ok {
			c.Set(constants.HeaderKeyVary, constants.HeaderValueAuthorization)
		}

		return c.Next()
	}
}

func CacheKeyGenerator(c *fiber.Ctx) string {
	switch c.Path() {
	case constants.SearchProfiles:
		return c.OriginalURL()
	default:
		return c.Path()
	}
}
