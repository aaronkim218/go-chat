package postgres

type Postgres struct{}

type Config struct{}

func New(cfg *Config) *Postgres {
	return &Postgres{}
}
