package postgres

import (
	"context"
	"errors"
	"fmt"
	"go-chat/internal/models"
	"go-chat/internal/xerrors"

	"github.com/aaronkim218/dynasql"
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
	setClause, args := dynasql.GenSetClauseFromFlatStruct(profile)
	query := fmt.Sprintf("UPDATE profiles %s WHERE user_id = $%d", setClause, len(args)+1)
	ct, err := p.pool.Exec(ctx, query, append(args, userId)...)
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
