package postgres

import (
	"context"
	"go-chat/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (p *Postgres) CreateMessage(ctx context.Context, message models.Message) error {
	const query string = `INSERT INTO messages (id, room_id, created_at, author, content) VALUES ($1, $2, $3, auth.uid(), $4)`
	// TODO: remove all usage of auth.uid() - its for RLS. i will be manually handling authorization with the user id i get from the jwt
	if _, err := p.pool.Exec(ctx, query,
		message.Id,
		message.RoomId,
		message.CreatedAt,
		message.Content,
	); err != nil {
		return err
	}

	return nil
}

func (p *Postgres) GetMessagesByRoomId(ctx context.Context, roomId uuid.UUID) ([]models.Message, error) {
	const query string = `SELECT id, room_id, created_at, author, content FROM messages WHERE room_id = $1`
	rows, err := p.pool.Query(ctx, query, roomId)
	if err != nil {
		return nil, err
	}

	messages, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.Message, error) {
		message, err := pgx.RowToStructByName[models.Message](row)
		if err != nil {
			return models.Message{}, err
		}

		return message, nil
	})

	return messages, nil
}

func (p *Postgres) DeleteMessageById(ctx context.Context, messageId uuid.UUID) error {
	const query string = `DELETE FROM messages WHERE id = $1`
	if _, err := p.pool.Exec(ctx, query, messageId); err != nil {
		return err
	}

	return nil
}
