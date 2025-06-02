package postgres

import (
	"context"
	"errors"
	"go-chat/internal/constants"
	"go-chat/internal/models"
	"go-chat/internal/xerrors"
	"log/slog"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (p *Postgres) CreateRoom(ctx context.Context, room models.Room, members []uuid.UUID) error {
	const roomsQuery string = `INSERT INTO rooms (id, host) VALUES ($1, $2)`
	const usersRoomsQuery string = `INSERT INTO users_rooms (user_id, room_id) VALUES ($1, $2)`

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
	batch.Queue(roomsQuery, room.Id, room.Host)
	batch.Queue(usersRoomsQuery, room.Host, room.Id)
	for _, userId := range members {
		batch.Queue(usersRoomsQuery, userId, room.Id)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	var joinedErr error
	for range batch.Len() {
		if _, err := results.Exec(); err != nil {
			if xerrors.IsForeignKeyViolation(err, constants.RoomsHostFKeyConstraint) {
				return xerrors.NotFoundError("user", map[string]string{
					"id": room.Host.String(),
				})
			}

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
