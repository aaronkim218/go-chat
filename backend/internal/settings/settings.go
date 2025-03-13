package settings

import "github.com/caarlos0/env/v11"

type Settings struct {
	Storage Storage
	Server  Server
}

func Load() (Settings, error) {
	return env.ParseAs[Settings]()
}
