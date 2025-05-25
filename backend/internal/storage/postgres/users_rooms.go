package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (p *Postgres) AddUsersToRoom(ctx context.Context, userIds []uuid.UUID, roomId uuid.UUID) error {
	const query string = `INSERT INTO users_rooms (user_id, room_id) VALUES ($1, $2)`

	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	batch := &pgx.Batch{}
	for _, userId := range userIds {
		batch.Queue(query, userId, roomId)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	var joinedErr error
	for range userIds {
		if _, err := results.Exec(); err != nil {
			joinedErr = errors.Join(joinedErr, err)
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
