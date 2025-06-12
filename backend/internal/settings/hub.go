package settings

type Hub struct {
	Workers  int    `env:"WORKERS" envDefault:"8"`
	LogLevel string `env:"LOG_LEVEL" envDefault:"INFO"`
}
