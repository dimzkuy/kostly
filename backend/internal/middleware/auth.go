package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/dimzkuy/kostly/internal/shared/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type authContextKey struct{}

const dbQueryTimeout = 5 * time.Second

// Role represents a server-authoritative Kostly user role from public.profiles.
type Role string

const (
	RoleOwner  Role = "OWNER"
	RoleTenant Role = "TENANT"
)

// AuthUser represents the authenticated and authorized user stored in Gin context.
type AuthUser struct {
	UserID        uuid.UUID
	Role          Role
	EmailVerified bool
}

// Profile represents the authoritative user profile record in public.profiles.
type Profile struct {
	ID       uuid.UUID
	Role     Role
	IsActive bool
}

// ErrProfileNotFound is returned when no profile exists for the authenticated user ID.
var ErrProfileNotFound = errors.New("profile not found")

// ProfileRepository retrieves authoritative user profiles from PostgreSQL.
type ProfileRepository interface {
	GetProfileByID(ctx context.Context, userID uuid.UUID) (*Profile, error)
}

type postgresProfileRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresProfileRepository creates a ProfileRepository backed by pgxpool.
func NewPostgresProfileRepository(pool *pgxpool.Pool) ProfileRepository {
	return &postgresProfileRepository{pool: pool}
}

func (r *postgresProfileRepository) GetProfileByID(ctx context.Context, userID uuid.UUID) (*Profile, error) {
	queryCtx, cancel := context.WithTimeout(ctx, dbQueryTimeout)
	defer cancel()

	const query = `
		SELECT id, role, is_active
		FROM public.profiles
		WHERE id = $1
	`

	var profile Profile
	var roleStr string
	err := r.pool.QueryRow(queryCtx, query, userID).Scan(&profile.ID, &roleStr, &profile.IsActive)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		return nil, err
	}

	profile.Role = Role(roleStr)
	return &profile, nil
}

// GetAuthUser safely retrieves the authenticated user from the request context.
func GetAuthUser(c *gin.Context) (AuthUser, bool) {
	if c == nil || c.Request == nil {
		return AuthUser{}, false
	}
	user, ok := c.Request.Context().Value(authContextKey{}).(AuthUser)
	return user, ok
}

// RequireVerifiedUser returns a Gin middleware that enforces:
// 1. Bearer token extraction from Authorization header
// 2. Supabase JWT verification via JWKS
// 3. Verified email status
// 4. Active profile with valid role (OWNER or TENANT) in public.profiles
func RequireVerifiedUser(verifier TokenVerifier, profiles ProfileRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		if verifier == nil || profiles == nil {
			response.InternalError(c)
			c.Abort()
			return
		}

		token, ok := extractBearerToken(c.GetHeader("Authorization"))
		if !ok {
			response.Error(c, http.StatusUnauthorized, "AUTH_REQUIRED", "Missing or invalid authorization header.")
			c.Abort()
			return
		}

		claims, err := verifier.Verify(c.Request.Context(), token)
		if err != nil || claims == nil {
			response.Error(c, http.StatusUnauthorized, "AUTH_REQUIRED", "Invalid or expired access token.")
			c.Abort()
			return
		}

		if !claims.EmailVerified {
			response.Error(c, http.StatusForbidden, "EMAIL_VERIFICATION_REQUIRED", "Email verification is required to access this resource.")
			c.Abort()
			return
		}

		profile, err := profiles.GetProfileByID(c.Request.Context(), claims.UserID)
		if err != nil {
			if errors.Is(err, ErrProfileNotFound) {
				response.Error(c, http.StatusUnauthorized, "AUTH_REQUIRED", "Authenticated user profile not found.")
				c.Abort()
				return
			}
			response.InternalError(c)
			c.Abort()
			return
		}
		if profile == nil {
			response.InternalError(c)
			c.Abort()
			return
		}

		if !profile.IsActive {
			response.Error(c, http.StatusForbidden, "FORBIDDEN", "Account is inactive.")
			c.Abort()
			return
		}

		if profile.Role != RoleOwner && profile.Role != RoleTenant {
			response.Error(c, http.StatusForbidden, "FORBIDDEN", "Account role is not permitted.")
			c.Abort()
			return
		}

		authUser := AuthUser{
			UserID:        profile.ID,
			Role:          profile.Role,
			EmailVerified: claims.EmailVerified,
		}
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), authContextKey{}, authUser))
		c.Next()
	}
}

func extractBearerToken(header string) (string, bool) {
	if header == "" {
		return "", false
	}

	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", false
	}

	token := strings.TrimSpace(parts[1])
	if token == "" || strings.ContainsAny(token, " \t\r\n") {
		return "", false
	}

	return token, true
}
