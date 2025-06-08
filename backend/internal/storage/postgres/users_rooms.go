package postgres

import (
	"context"
	"errors"
	"go-chat/internal/types"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func (p *Postgres) AddUsersToRoom(ctx context.Context, userIds []uuid.UUID, roomId uuid.UUID) (types.BulkResult[uuid.UUID], error) {
	// consider using a trigger to enforce the existence check
	const query string = `
	INSERT INTO users_rooms (user_id, room_id)
	SELECT $1, $2
	WHERE EXISTS (
		SELECT 1 FROM profiles WHERE user_id = $1
	)
	ON CONFLICT DO NOTHING
	`

	bulkResult := types.BulkResult[uuid.UUID]{}
	batch := &pgx.Batch{}
	for _, userId := range userIds {
		batch.Queue(query, userId, roomId).Exec(func(ct pgconn.CommandTag) error {
			if ct.RowsAffected() == 0 {
				bulkResult.Failures = append(bulkResult.Failures, types.Failure[uuid.UUID]{
					Item:    userId,
					Message: "failed to add user to room",
				})
			} else {
				bulkResult.Successes = append(bulkResult.Successes, userId)
			}

			return nil
		})
	}

	results := p.pool.SendBatch(ctx, batch)
	if err := results.Close(); err != nil {
		return types.BulkResult[uuid.UUID]{}, err
	}

	return bulkResult, nil
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
