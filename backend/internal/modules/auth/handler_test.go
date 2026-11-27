package auth

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/dimzkuy/kostly/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	testIssuer = "https://example.supabase.co/auth/v1"
	testKid    = "auth-kid-1"
)

type mockAuthRepo struct {
	profiles map[uuid.UUID]*Profile
	err      error
	lastID   uuid.UUID
}

func (m *mockAuthRepo) GetByID(_ context.Context, userID uuid.UUID) (*Profile, error) {
	m.lastID = userID
	if m.err != nil {
		return nil, m.err
	}
	p, ok := m.profiles[userID]
	if !ok {
		return nil, ErrProfileNotFound
	}
	return p, nil
}

type mockMiddlewareProfileRepo struct {
	profiles map[uuid.UUID]*middleware.Profile
}

func (m *mockMiddlewareProfileRepo) GetProfileByID(_ context.Context, userID uuid.UUID) (*middleware.Profile, error) {
	p, ok := m.profiles[userID]
	if !ok {
		return nil, middleware.ErrProfileNotFound
	}
	return p, nil
}

func generateTestECKey(t *testing.T) *ecdsa.PrivateKey {
	t.Helper()
	k, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generating EC key: %v", err)
	}
	return k
}

func startMockJWKSServer(t *testing.T, kid string, pub *ecdsa.PublicKey) *httptest.Server {
	t.Helper()
	byteLen := (pub.Curve.Params().BitSize + 7) / 8
	x := base64.RawURLEncoding.EncodeToString(pub.X.FillBytes(make([]byte, byteLen)))
	y := base64.RawURLEncoding.EncodeToString(pub.Y.FillBytes(make([]byte, byteLen)))

	payload := map[string]any{
		"keys": []map[string]any{
			{
				"kty": "EC",
				"kid": kid,
				"use": "sig",
				"alg": "ES256",
				"crv": "P-256",
				"x":   x,
				"y":   y,
			},
		},
	}

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(payload)
	}))
}

func signTestToken(t *testing.T, key *ecdsa.PrivateKey, kid string, sub string) string {
	t.Helper()
	claims := jwt.MapClaims{
		"sub":            sub,
		"iss":            testIssuer,
		"aud":            "authenticated",
		"exp":            time.Now().Add(15 * time.Minute).Unix(),
		"iat":            time.Now().Unix(),
		"email_verified": true,
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
	tok.Header["kid"] = kid
	signed, err := tok.SignedString(key)
	if err != nil {
		t.Fatalf("signing token: %v", err)
	}
	return signed
}

func setupTestEngine(jwksURL string, mwRepo middleware.ProfileRepository, authRepo Repository) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	verifier := middleware.NewSupabaseJWTVerifier(testIssuer, jwksURL)
	protected := r.Group("/api/v1")
	protected.Use(middleware.RequireVerifiedUser(verifier, mwRepo))

	svc := NewService(authRepo)
	h := NewHandler(svc)
	protected.GET("/me", h.GetMe)

	return r
}

func strPtr(s string) *string {
	return &s
}

func TestGetMeEndpoint(t *testing.T) {
	key := generateTestECKey(t)
	wrongKey := generateTestECKey(t)
	jwksSrv := startMockJWKSServer(t, testKid, &key.PublicKey)
	defer jwksSrv.Close()

	ownerID := uuid.New()
	tenantID := uuid.New()
	missingProfileID := uuid.New()
	now := time.Now().UTC().Truncate(time.Second)

	mwRepo := &mockMiddlewareProfileRepo{
		profiles: map[uuid.UUID]*middleware.Profile{
			ownerID:          {ID: ownerID, Role: middleware.RoleOwner, IsActive: true},
			tenantID:         {ID: tenantID, Role: middleware.RoleTenant, IsActive: true},
			missingProfileID: {ID: missingProfileID, Role: middleware.RoleTenant, IsActive: true},
		},
	}

	authRepo := &mockAuthRepo{
		profiles: map[uuid.UUID]*Profile{
			ownerID: {
				ID:         ownerID,
				Role:       "OWNER",
				FullName:   "Budi Pemilik",
				Phone:      strPtr("+6281234567890"),
				AvatarPath: strPtr("avatars/owner.jpg"),
				IsActive:   true,
				CreatedAt:  now,
				UpdatedAt:  now,
			},
			tenantID: {
				ID:         tenantID,
				Role:       "TENANT",
				FullName:   "Siti Penyewa",
				Phone:      nil,
				AvatarPath: nil,
				IsActive:   true,
				CreatedAt:  now,
				UpdatedAt:  now,
			},
		},
	}

	router := setupTestEngine(jwksSrv.URL, mwRepo, authRepo)

	t.Run("1. Authenticated OWNER can retrieve their profile", func(t *testing.T) {
		token := signTestToken(t, key, testKid, ownerID.String())
		req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d (body=%s)", rec.Code, rec.Body.String())
		}

		var body struct {
			Data MeResponse `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshaling response: %v", err)
		}
		if body.Data.ID != ownerID || body.Data.Role != "OWNER" || body.Data.FullName != "Budi Pemilik" {
			t.Fatalf("unexpected profile data: %+v", body.Data)
		}
		if body.Data.Phone == nil || *body.Data.Phone != "+6281234567890" {
			t.Fatalf("expected phone to match, got %v", body.Data.Phone)
		}
		if body.Data.AvatarPath == nil || *body.Data.AvatarPath != "avatars/owner.jpg" {
			t.Fatalf("expected avatar_path to match, got %v", body.Data.AvatarPath)
		}
		if !body.Data.EmailVerified || !body.Data.IsActive {
			t.Fatalf("expected email_verified=true and is_active=true, got %+v", body.Data)
		}
		if strings.Contains(rec.Body.String(), "deactivated_at") {
			t.Fatal("response must not expose deactivated_at")
		}
	})

	t.Run("2. Authenticated TENANT can retrieve their profile", func(t *testing.T) {
		token := signTestToken(t, key, testKid, tenantID.String())
		req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d (body=%s)", rec.Code, rec.Body.String())
		}

		var body struct {
			Data MeResponse `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshaling response: %v", err)
		}
		if body.Data.ID != tenantID || body.Data.Role != "TENANT" || body.Data.FullName != "Siti Penyewa" {
			t.Fatalf("unexpected profile data: %+v", body.Data)
		}
		if body.Data.Phone != nil || body.Data.AvatarPath != nil {
			t.Fatalf("expected nullable fields to be nil, got phone=%v avatar_path=%v", body.Data.Phone, body.Data.AvatarPath)
		}
	})

	t.Run("3. Request without token is rejected by middleware", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d (body=%s)", rec.Code, rec.Body.String())
		}
	})

	t.Run("4. Request with invalid token is rejected by middleware", func(t *testing.T) {
		badToken := signTestToken(t, wrongKey, testKid, tenantID.String())
		req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
		req.Header.Set("Authorization", "Bearer "+badToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d (body=%s)", rec.Code, rec.Body.String())
		}
	})

	t.Run("5a. Profile not found returns 404 RESOURCE_NOT_FOUND", func(t *testing.T) {
		token := signTestToken(t, key, testKid, missingProfileID.String())
		req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d (body=%s)", rec.Code, rec.Body.String())
		}
		var errBody struct {
			Error struct {
				Code string `json:"code"`
			} `json:"error"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &errBody); err != nil {
			t.Fatalf("unmarshaling error: %v", err)
		}
		if errBody.Error.Code != "RESOURCE_NOT_FOUND" {
			t.Fatalf("expected RESOURCE_NOT_FOUND, got %q", errBody.Error.Code)
		}
	})

	t.Run("5b. Profile lookup database failure returns generic 500 INTERNAL_ERROR", func(t *testing.T) {
		failingRepo := &mockAuthRepo{err: errors.New("FATAL: password authentication failed for user postgres")}
		failingRouter := setupTestEngine(jwksSrv.URL, mwRepo, failingRepo)

		token := signTestToken(t, key, testKid, tenantID.String())
		req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		failingRouter.ServeHTTP(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d (body=%s)", rec.Code, rec.Body.String())
		}
		if strings.Contains(rec.Body.String(), "postgres") || strings.Contains(rec.Body.String(), "FATAL") {
			t.Fatalf("response leaked internal SQL error: %s", rec.Body.String())
		}
		var errBody struct {
			Error struct {
				Code string `json:"code"`
			} `json:"error"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &errBody); err != nil {
			t.Fatalf("unmarshaling error: %v", err)
		}
		if errBody.Error.Code != "INTERNAL_ERROR" {
			t.Fatalf("expected INTERNAL_ERROR, got %q", errBody.Error.Code)
		}
	})

	t.Run("6. Does not trust client-supplied user ID or role", func(t *testing.T) {
		token := signTestToken(t, key, testKid, tenantID.String())
		req := httptest.NewRequest(http.MethodGet, "/api/v1/me?user_id="+ownerID.String()+"&id="+ownerID.String()+"&role=OWNER", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("X-User-Id", ownerID.String())
		req.Header.Set("X-Role", "OWNER")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d (body=%s)", rec.Code, rec.Body.String())
		}
		if authRepo.lastID != tenantID {
			t.Fatalf("expected repository lookup for %s, got %s", tenantID, authRepo.lastID)
		}

		var body struct {
			Data MeResponse `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshaling response: %v", err)
		}
		if body.Data.ID != tenantID || body.Data.Role != "TENANT" {
			t.Fatalf("client-supplied identity/role influenced response: %+v", body.Data)
		}
	})

	t.Run("Handler rejects unauthenticated Gin context defensively", func(t *testing.T) {
		gin.SetMode(gin.TestMode)
		r := gin.New()
		h := NewHandler(NewService(authRepo))
		r.GET("/me", h.GetMe)

		req := httptest.NewRequest(http.MethodGet, "/me", nil)
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rec.Code)
		}
	})
}
