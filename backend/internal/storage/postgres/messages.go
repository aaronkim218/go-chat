package postgres

import (
	"context"

	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/utils"
	"go-chat/internal/xerrors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (p *Postgres) CreateMessage(ctx context.Context, message models.Message) error {
	const query string = `INSERT INTO messages (id, room_id, created_at, author, content) VALUES ($1, $2, $3, $4, $5)`

	if _, err := utils.Retry(ctx, func(ctx context.Context) (struct{}, error) {
		_, err := p.pool.Exec(ctx, query,
			message.Id,
			message.RoomId,
			message.CreatedAt,
			message.Author,
			message.Content,
		)

		return struct{}{}, err
	}); err != nil {
		return err
	}

	return nil
}

func (p *Postgres) GetUserMessagesByRoomId(ctx context.Context, roomId uuid.UUID, userId uuid.UUID) ([]types.UserMessage, error) {
	// TODO: can i use some kind of table constraint to enforce the existence of user_id room_id pair in users_rooms?
	const query string = `
	SELECT m.id, m.room_id, m.created_at, m.author, m.content, p.username, p.first_name, p.last_name
	FROM messages AS m
	INNER JOIN profiles AS p ON m.author = p.user_id
	WHERE room_id = $1
	  AND EXISTS (
	    SELECT 1
	    FROM users_rooms
	    WHERE room_id = $1 AND user_id = $2
	  );
	`

	rows, err := utils.Retry(ctx, func(ctx context.Context) (pgx.Rows, error) {
		return p.pool.Query(ctx, query, roomId, userId)
	})
	if err != nil {
		return nil, err
	}

	userMessages, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (types.UserMessage, error) {
		userMessage, err := pgx.RowToStructByName[types.UserMessage](row)
		if err != nil {
			return types.UserMessage{}, err
		}

		return userMessage, nil
	})
	if err != nil {
		return nil, err
	}

	return userMessages, nil
}

func (p *Postgres) DeleteMessageById(ctx context.Context, messageId uuid.UUID, userId uuid.UUID) error {
	const query string = `DELETE FROM messages WHERE id = $1 AND author = $2`

	if _, err := utils.Retry(ctx, func(ctx context.Context) (struct{}, error) {
		ct, err := p.pool.Exec(ctx, query, messageId, userId)
		if err != nil {
			return struct{}{}, err
		}

		if ct.RowsAffected() == 0 {
			return struct{}{}, utils.CreateNonRetryableError(
				xerrors.NotFoundError("message", map[string]string{
					"id":     messageId.String(),
					"author": userId.String(),
				}),
			)
		}

		return struct{}{}, nil
	}); err != nil {
		return err
	}

	return nil
}
