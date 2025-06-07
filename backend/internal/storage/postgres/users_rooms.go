package postgres

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (p *Postgres) AddUsersToRoom(ctx context.Context, userIds []uuid.UUID, roomId uuid.UUID) error {
	// consider using a trigger to enforce the existence check
	const query string = `
	INSERT INTO users_rooms (user_id, room_id)
	SELECT $1, $2
	WHERE EXISTS (
		SELECT 1 FROM profiles WHERE user_id = $1
	)
	`

	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if err := tx.Rollback(ctx); err != nil {
			slog.Error("error rolling back transaction",
				slog.String("error", err.Error()),
			)
		}
	}()

	batch := &pgx.Batch{}
	for _, userId := range userIds {
		batch.Queue(query, userId, roomId)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	var joinedErr error
	for _, userId := range userIds {
		if ct, err := results.Exec(); err != nil {
			joinedErr = errors.Join(joinedErr, err)
		} else if ct.RowsAffected() == 0 {
			joinedErr = errors.Join(joinedErr, fmt.Errorf("profile with user_id=%s not found", userId.String()))
		}
	}

	if joinedErr != nil {
		return joinedErr
	}

	if err := results.Close(); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	return nil
}

func (p *Postgres) CheckUserInRoom(ctx context.Context, roomId uuid.UUID, userId uuid.UUID) (bool, error) {
	const query string = `SELECT 1 FROM users_rooms WHERE user_id = $1 AND room_id = $2`

	var exists int
	if err := p.pool.QueryRow(ctx, query, userId, roomId).Scan(&exists); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}

		return false, err
	}

	return true, nil
}
