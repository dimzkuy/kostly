package auth

import (
	"context"
	"time"

	"github.com/dimzkuy/kostly/internal/middleware"
	"github.com/google/uuid"
)

// MeResponse represents the authenticated user profile payload returned by GET /api/v1/me.
type MeResponse struct {
	ID            uuid.UUID `json:"id"`
	Role          string    `json:"role"`
	FullName      string    `json:"full_name"`
	Phone         *string   `json:"phone"`
	AvatarPath    *string   `json:"avatar_path"`
	EmailVerified bool      `json:"email_verified"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Service defines business operations for the auth module.
type Service interface {
	GetMe(ctx context.Context, authUser middleware.AuthUser) (*MeResponse, error)
}

type service struct {
	repo Repository
}

// NewService creates an auth Service with the given Repository.
func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetMe(ctx context.Context, authUser middleware.AuthUser) (*MeResponse, error) {
	profile, err := s.repo.GetByID(ctx, authUser.UserID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, ErrProfileNotFound
	}

	return &MeResponse{
		ID:            profile.ID,
		Role:          profile.Role,
		FullName:      profile.FullName,
		Phone:         profile.Phone,
		AvatarPath:    profile.AvatarPath,
		EmailVerified: authUser.EmailVerified,
		IsActive:      profile.IsActive,
		CreatedAt:     profile.CreatedAt,
		UpdatedAt:     profile.UpdatedAt,
	}, nil
}
