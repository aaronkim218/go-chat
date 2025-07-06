package constants

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

var (
	// functions return true if request should be cached
	CacheableRoutes = map[string]func(c *fiber.Ctx) bool{
		SearchProfiles: func(c *fiber.Ctx) bool {
			return c.Query("excludeRoom") == ""
		},
	}
)

const (
	CacheExpiration = 10 * time.Second
)
