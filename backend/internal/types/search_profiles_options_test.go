package types

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSearchProfilesOptions_Validate(t *testing.T) {
	tests := []struct {
		name     string
		input    SearchProfilesOptions
		wantErrs map[string]string
		wantVals SearchProfilesOptions
	}{
		{
			name:     "valid input",
			input:    SearchProfilesOptions{Username: "alpha", Limit: 20, Offset: 5},
			wantErrs: map[string]string{},
			wantVals: SearchProfilesOptions{Username: "alpha", Limit: 20, Offset: 5},
		},
		{
			name:     "missing username",
			input:    SearchProfilesOptions{Limit: 20, Offset: 0},
			wantErrs: map[string]string{"username": "username cannot be empty"},
			wantVals: SearchProfilesOptions{Username: "", Limit: 20, Offset: 0},
		},
		{
			name:     "invalid limit and offset",
			input:    SearchProfilesOptions{Username: "bravo", Limit: 0, Offset: -5},
			wantErrs: map[string]string{},
			wantVals: SearchProfilesOptions{Username: "bravo", Limit: defaultLimit, Offset: defaultOffset},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := tt.input.Validate()

			assert.Equal(t, tt.wantErrs, errs, "error map mismatch")
			assert.Equal(t, tt.wantVals.Limit, tt.input.Limit, "limit mismatch")
			assert.Equal(t, tt.wantVals.Offset, tt.input.Offset, "offset mismatch")
		})
	}
}
