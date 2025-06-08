package types

type SearchProfilesOptions struct {
	Username string `query:"username"`
	Limit    int    `query:"limit"`
	Offset   int    `query:"offset"`
}

const (
	defaultLimit  int = 10
	defaultOffset int = 0
)

func (spo *SearchProfilesOptions) Validate() map[string]string {
	errMap := make(map[string]string)

	if len(spo.Username) == 0 {
		errMap["username"] = "username cannot be empty"
	}

	if spo.Limit < 1 {
		spo.Limit = defaultLimit
	}

	if spo.Offset < 0 {
		spo.Offset = defaultOffset
	}

	return errMap
}
