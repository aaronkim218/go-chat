package constants

import "time"

var (
	CacheableRoutes = map[string]struct{}{
		SearchProfiles: {},
	}
)

const (
	CacheExpiration = 10 * time.Second
)
