package auth

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const dbQueryTimeout = 5 * time.Second

// ErrProfileNotFound is returned when no profile record exists for the given user ID.
var ErrProfileNotFound = errors.New("profile not found")

// Profile represents a user profile row from public.profiles.
type Profile struct {
	ID         uuid.UUID
	Role       string
	FullName   string
	Phone      *string
	AvatarPath *string
	IsActive   bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Repository defines persistence operations for the auth module.
type Repository interface {
	GetByID(ctx context.Context, userID uuid.UUID) (*Profile, error)
}

type postgresRepository struct {
	pool *pgxpool.Pool
}

// NewRepository creates a PostgreSQL-backed auth Repository using the injected pool.
func NewRepository(pool *pgxpool.Pool) Repository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) GetByID(ctx context.Context, userID uuid.UUID) (*Profile, error) {
	if r.pool == nil {
		return nil, errors.New("database pool is not initialized")
	}

	queryCtx, cancel := context.WithTimeout(ctx, dbQueryTimeout)
	defer cancel()

	const query = `
		SELECT id, role, full_name, phone, avatar_path, is_active, created_at, updated_at
		FROM public.profiles
		WHERE id = $1
	`

	var p Profile
	err := r.pool.QueryRow(queryCtx, query, userID).Scan(
		&p.ID,
		&p.Role,
		&p.FullName,
		&p.Phone,
		&p.AvatarPath,
		&p.IsActive,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		return nil, err
	}

	return &p, nil
}
