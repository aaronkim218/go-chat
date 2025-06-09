package postgres

import (
	"context"

	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/xerrors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func (p *Postgres) CreateRoom(ctx context.Context, room models.Room, members []uuid.UUID) (types.BulkResult[uuid.UUID], error) {
	const roomsQuery string = `INSERT INTO rooms (id, host) VALUES ($1, $2)`
	const usersRoomsHostQuery = `INSERT INTO users_rooms (user_id, room_id) VALUES ($1, $2)`
	const usersRoomsMemberQuery string = `
	INSERT INTO users_rooms (user_id, room_id)
	SELECT $1, $2
	WHERE EXISTS (
		SELECT 1 FROM profiles WHERE user_id = $1
	)
	`

	bulkResult := types.BulkResult[uuid.UUID]{}
	batch := &pgx.Batch{}
	batch.Queue(roomsQuery, room.Id, room.Host)
	batch.Queue(usersRoomsHostQuery, room.Host, room.Id)
	for _, userId := range members {
		batch.Queue(usersRoomsMemberQuery, userId, room.Id).Exec(func(ct pgconn.CommandTag) error {
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

func (p *Postgres) GetRoomsByUserId(ctx context.Context, userId uuid.UUID) ([]models.Room, error) {
	const query string = `
	SELECT r.id, r.host
	FROM users_rooms AS ur
	LEFT JOIN rooms AS r on ur.room_id = r.id
	WHERE ur.user_id = $1
	`
	rows, err := p.pool.Query(ctx, query, userId)
	if err != nil {
		return nil, err
	}

	rooms, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.Room, error) {
		room, err := pgx.RowToStructByName[models.Room](row)
		if err != nil {
			return models.Room{}, err
		}

		return room, nil
	})
	if err != nil {
		return nil, err
	}

	return rooms, nil
}

func (p *Postgres) DeleteRoomById(ctx context.Context, roomId uuid.UUID, userId uuid.UUID) error {
	const query string = `DELETE FROM rooms WHERE id = $1 AND host = $2`
	ct, err := p.pool.Exec(ctx, query, roomId, userId)
	if err != nil {
		return err
	}

	if ct.RowsAffected() == 0 {
		return xerrors.NotFoundError("room", map[string]string{
			"id":   roomId.String(),
			"host": userId.String(),
		})
	}

	return nil
}
