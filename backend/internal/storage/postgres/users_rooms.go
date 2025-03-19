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
