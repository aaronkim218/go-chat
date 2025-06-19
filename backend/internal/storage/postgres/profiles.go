package postgres

import (
	"context"
	"errors"

	"github.com/Masterminds/squirrel"

	"go-chat/internal/constants"
	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/xerrors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (p *Postgres) GetProfileByUserId(ctx context.Context, userId uuid.UUID) (models.Profile, error) {
	const query string = `SELECT user_id, username, first_name, last_name FROM profiles WHERE user_id = $1`
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

func (p *Postgres) PatchProfileByUserId(ctx context.Context, partialProfile types.PartialProfile, userId uuid.UUID) error {
	psql := squirrel.StatementBuilder.PlaceholderFormat(squirrel.Dollar)

	builder := psql.Update("profiles")

	if partialProfile.FirstName != nil {
		builder = builder.Set("first_name", *partialProfile.FirstName)
	}

	if partialProfile.LastName != nil {
		builder = builder.Set("last_name", *partialProfile.LastName)
	}

	if partialProfile.Username != nil {
		builder = builder.Set("username", *partialProfile.Username)
	}

	builder = builder.Where("user_id = ?", userId.String())

	query, args, err := builder.ToSql()
	if err != nil {
		return err
	}

	ct, err := p.pool.Exec(ctx, query, args...)
	if err != nil {
		if xerrors.IsUniqueViolation(err, constants.ProfilesUsernameUniqueConstraint) {
			return xerrors.ConflictError("user", "username", *partialProfile.Username)
		}

		return err
	}

	if ct.RowsAffected() == 0 {
		return xerrors.NotFoundError("profile", map[string]string{
			"user_id": userId.String(),
		})
	}

	return nil
}

func (p *Postgres) CreateProfile(ctx context.Context, profile models.Profile) error {
	const query string = `INSERT INTO profiles (user_id, username, first_name, last_name) VALUES ($1, $2, $3, $4)`
	if _, err := p.pool.Exec(ctx, query, profile.UserId, profile.Username, profile.FirstName, profile.LastName); err != nil {
		if xerrors.IsUniqueViolation(err, constants.ProfilesPKeyUniqueConstraint) {
			return xerrors.ConflictError("profile", "id", profile.UserId.String())
		} else if xerrors.IsUniqueViolation(err, constants.ProfilesUsernameUniqueConstraint) {
			return xerrors.ConflictError("user", "username", profile.Username)
		}

		return err
	}

	return nil
}

func (p *Postgres) SearchProfiles(ctx context.Context, options types.SearchProfilesOptions, userId uuid.UUID) ([]models.Profile, error) {
	psql := squirrel.StatementBuilder.PlaceholderFormat(squirrel.Dollar)

	builder := psql.
		Select("user_id, username, first_name, last_name").
		From("profiles").
		Where("username ILIKE ?", "%"+options.Username+"%").
		Where("user_id != ?", userId.String())

	if options.ExcludeRoom != nil {
		builder = builder.
			Where(
				squirrel.Expr(
					`NOT EXISTS (
						SELECT 1 FROM users_rooms
						WHERE users_rooms.user_id = profiles.user_id
							AND users_rooms.room_id = ?
					)`,
					options.ExcludeRoom.String(),
				),
			)
	}

	builder = builder.
		Limit(uint64(options.Limit)).
		Offset(uint64(options.Offset))

	query, args, err := builder.ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := p.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	profiles, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.Profile, error) {
		profile, err := pgx.RowToStructByName[models.Profile](row)
		if err != nil {
			return models.Profile{}, err
		}

		return profile, nil
	})
	if err != nil {
		return nil, err
	}

	return profiles, nil
}
