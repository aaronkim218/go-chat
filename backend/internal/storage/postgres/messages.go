package postgres

import (
	"context"
	"go-chat/internal/models"
	"go-chat/internal/xerrors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (p *Postgres) CreateMessage(ctx context.Context, message models.Message) error {
	const query string = `INSERT INTO messages (id, room_id, created_at, author, content) VALUES ($1, $2, $3, $4, $5)`
	if _, err := p.pool.Exec(ctx, query,
		message.Id,
		message.RoomId,
		message.CreatedAt,
		message.Author,
		message.Content,
	); err != nil {
		return err
	}

	return nil
}

func (p *Postgres) GetMessagesByRoomId(ctx context.Context, roomId uuid.UUID, userId uuid.UUID) ([]models.Message, error) {
	const query string = `
	SELECT id, room_id, created_at, author, content
	FROM messages
	WHERE room_id = $1
	  AND EXISTS (
	    SELECT 1
	    FROM users_rooms
	    WHERE room_id = $1 AND user_id = $2
	  );
	`
	rows, err := p.pool.Query(ctx, query, roomId, userId)
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
	if err != nil {
		return nil, err
	}

	return messages, nil
}

func (p *Postgres) DeleteMessageById(ctx context.Context, messageId uuid.UUID, userId uuid.UUID) error {
	const query string = `DELETE FROM messages WHERE id = $1 AND author = $2`
	ct, err := p.pool.Exec(ctx, query, messageId, userId)
	if err != nil {
		return err
	}

	if ct.RowsAffected() == 0 {
		return xerrors.NotFoundError("message", map[string]string{
			"id":     messageId.String(),
			"author": userId.String(),
		})
	}

	return nil
}
