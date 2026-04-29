package settings

type Jwt struct {
	JwksURL string `env:"JWKS_URL,required"`
}
