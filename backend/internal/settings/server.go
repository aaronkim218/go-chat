package settings

type Server struct {
	Port string `env:"PORT" envDefault:"42069"`
}
