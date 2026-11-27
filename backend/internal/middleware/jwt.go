package middleware

import (
	"context"
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	supabaseDefaultAudience = "authenticated"
)

var allowedJWTAlgorithms = []string{"ES256", "RS256", "EdDSA"}

// VerifiedClaims represents the trusted identity claims extracted from a verified Supabase JWT.
type VerifiedClaims struct {
	UserID        uuid.UUID
	EmailVerified bool
}

// TokenVerifier verifies a raw JWT string and returns the extracted claims.
type TokenVerifier interface {
	Verify(ctx context.Context, rawToken string) (*VerifiedClaims, error)
}

type supabaseJWTClaims struct {
	jwt.RegisteredClaims
	EmailVerified *bool `json:"email_verified"`
}

// SupabaseJWTVerifier verifies Supabase Auth access tokens using JWKS.
type SupabaseJWTVerifier struct {
	issuer   string
	audience string
	jwks     *JWKSClient
}

// NewSupabaseJWTVerifier creates a verifier for the given Supabase issuer and JWKS URL.
func NewSupabaseJWTVerifier(issuer, jwksURL string) *SupabaseJWTVerifier {
	return &SupabaseJWTVerifier{
		issuer:   issuer,
		audience: supabaseDefaultAudience,
		jwks:     NewJWKSClient(jwksURL),
	}
}

// Verify validates the JWT signature, algorithm, exp, iss, aud, and sub UUID.
func (v *SupabaseJWTVerifier) Verify(ctx context.Context, rawToken string) (*VerifiedClaims, error) {
	if rawToken == "" {
		return nil, errors.New("empty token")
	}

	claims := &supabaseJWTClaims{}
	token, err := jwt.ParseWithClaims(
		rawToken,
		claims,
		func(t *jwt.Token) (any, error) {
			kidRaw, ok := t.Header["kid"]
			if !ok {
				return nil, errors.New("missing kid header")
			}
			kid, ok := kidRaw.(string)
			if !ok || kid == "" {
				return nil, errors.New("invalid kid header")
			}
			return v.jwks.GetKeyForAlg(ctx, kid, t.Method.Alg())
		},
		jwt.WithValidMethods(allowedJWTAlgorithms),
		jwt.WithIssuer(v.issuer),
		jwt.WithAudience(v.audience),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}
	if token == nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	sub, err := uuid.Parse(claims.Subject)
	if err != nil || sub == uuid.Nil {
		return nil, errors.New("invalid subject UUID")
	}

	// Only trust the top-level signed email_verified claim, never user_metadata.
	// Fail closed when the claim is absent or false.
	emailVerified := claims.EmailVerified != nil && *claims.EmailVerified

	return &VerifiedClaims{
		UserID:        sub,
		EmailVerified: emailVerified,
	}, nil
}
