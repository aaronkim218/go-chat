package utils

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func GetUserIdFromToken(token *jwt.Token) (uuid.UUID, error) {
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.UUID{}, fmt.Errorf("failed to retrieve claims from jwt")
	}

	userId, err := claims.GetSubject()
	if err != nil {
		return uuid.UUID{}, err
	}

	uuidUserId, err := uuid.Parse(userId)
	if err != nil {
		return uuid.UUID{}, err
	}

	return uuidUserId, nil
}
