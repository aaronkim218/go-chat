package postgres

import (
	"context"
	"go-chat/internal/models"
)

func (p *Postgres) CreateRoom(ctx context.Context, room models.Room) error {
	const query string = `INSERT INTO rooms (id, host) VALUES ($1, $2)`
	if _, err := p.pool.Exec(ctx, query, room.Id, room.Host); err != nil {
		return err
	}

	return nil
}
