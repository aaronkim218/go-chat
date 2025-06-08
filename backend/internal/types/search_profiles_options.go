package types

type SearchProfilesOptions struct {
	Username string `query:"username"`
	Limit    int    `query:"limit"`
	Offset   int    `query:"offset"`
}

func (spo *SearchProfilesOptions) Validate() map[string]string {
	errMap := make(map[string]string)

	if len(spo.Username) == 0 {
		errMap["username"] = "username cannot be empty"
	}

	if spo.Limit < 1 {
		spo.Limit = 10
	}

	if spo.Offset < 0 {
		spo.Offset = 0
	}

	return errMap
}
