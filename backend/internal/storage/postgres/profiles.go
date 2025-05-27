package postgres

import (
	"context"
	"errors"
	"go-chat/internal/models"
	"go-chat/internal/xerrors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (p *Postgres) GetProfileByUserId(ctx context.Context, userId uuid.UUID) (models.Profile, error) {
	const query string = `SELECT user_id, username FROM profiles WHERE user_id = $1`
	rows, err := p.pool.Query(ctx, query, userId)
	if err != nil {
		return models.Profile{}, err
	}

	profile, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.Profile])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Profile{}, xerrors.NotFoundError("profile", map[string]string{
				"user_id": userId.String(),
			})
		}

		return models.Profile{}, err
	}

	return profile, nil
}

func (p *Postgres) PatchProfileByUserId(ctx context.Context, profile models.Profile, userId uuid.UUID) error {
	const query string = `
	UPDATE profiles
	SET
	username = $1
	WHERE user_id = $2
	`
	ct, err := p.pool.Exec(ctx, query, profile.Username, userId)
	if err != nil {
		return err
	}

	if ct.RowsAffected() == 0 {
		return xerrors.NotFoundError("profile", map[string]string{
			"user_id": userId.String(),
		})
	}

	return nil
}
