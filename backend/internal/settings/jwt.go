package settings

type Jwt struct {
	Secret string `env:"SECRET"`
}
