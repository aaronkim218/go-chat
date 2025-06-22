package constants

import "time"

var (
	CacheableRoutes = map[string]struct{}{
		SearchProfiles: {},
	}
)

const (
	CacheExpiration = 5 * time.Minute
)
