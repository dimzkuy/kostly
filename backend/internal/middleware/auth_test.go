package middleware

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
	"sync/atomic"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	testIssuer   = "https://example.supabase.co/auth/v1"
	testAudience = "authenticated"
)

type mockProfileRepo struct {
	profiles map[uuid.UUID]*Profile
	err      error
}

func (m *mockProfileRepo) GetProfileByID(_ context.Context, userID uuid.UUID) (*Profile, error) {
	if m.err != nil {
		return nil, m.err
	}
	p, ok := m.profiles[userID]
	if !ok {
		return nil, ErrProfileNotFound
	}
	return p, nil
}

type testErrorEnvelope struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func generateECKeyPair(t *testing.T) *ecdsa.PrivateKey {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generating EC key: %v", err)
	}
	return key
}

func ecPublicKeyToJWK(kid string, pub *ecdsa.PublicKey) jwkKey {
	byteLen := (pub.Curve.Params().BitSize + 7) / 8
	xBytes := pub.X.FillBytes(make([]byte, byteLen))
	yBytes := pub.Y.FillBytes(make([]byte, byteLen))

	return jwkKey{
		Kty: "EC",
		Kid: kid,
		Use: "sig",
		Alg: "ES256",
		Crv: "P-256",
		X:   base64.RawURLEncoding.EncodeToString(xBytes),
		Y:   base64.RawURLEncoding.EncodeToString(yBytes),
	}
}

func signTestJWT(t *testing.T, key *ecdsa.PrivateKey, kid string, claims jwt.MapClaims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
	if kid != "" {
		token.Header["kid"] = kid
	}
	signed, err := token.SignedString(key)
	if err != nil {
		t.Fatalf("signing test JWT: %v", err)
	}
	return signed
}

func baseClaims(sub string, emailVerified *bool) jwt.MapClaims {
	claims := jwt.MapClaims{
		"sub": sub,
		"iss": testIssuer,
		"aud": testAudience,
		"exp": time.Now().Add(15 * time.Minute).Unix(),
		"iat": time.Now().Unix(),
	}
	if emailVerified != nil {
		claims["email_verified"] = *emailVerified
	}
	return claims
}

func boolPtr(v bool) *bool {
	return &v
}

func setupAuthTestRouter(verifier TokenVerifier, repo ProfileRepository) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/protected", RequireVerifiedUser(verifier, repo), func(c *gin.Context) {
		user, ok := GetAuthUser(c)
		if !ok {
			c.Status(http.StatusInternalServerError)
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"user_id":        user.UserID.String(),
			"role":           user.Role,
			"email_verified": user.EmailVerified,
		})
	})
	return r
}

func assertErrorResponse(t *testing.T, rec *httptest.ResponseRecorder, wantStatus int, wantCode string) {
	t.Helper()
	if rec.Code != wantStatus {
		t.Fatalf("expected status %d, got %d (body=%s)", wantStatus, rec.Code, rec.Body.String())
	}
	var env testErrorEnvelope
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("decoding error response: %v (body=%s)", err, rec.Body.String())
	}
	if env.Error.Code != wantCode {
		t.Fatalf("expected error code %q, got %q", wantCode, env.Error.Code)
	}
	if env.Error.Message == "" {
		t.Fatal("expected non-empty error message")
	}
}

func TestRequireVerifiedUser(t *testing.T) {
	primaryKey := generateECKeyPair(t)
	wrongKey := generateECKeyPair(t)
	const primaryKid = "kid-1"

	jwksServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(jwksDocument{
			Keys: []jwkKey{ecPublicKeyToJWK(primaryKid, &primaryKey.PublicKey)},
		})
	}))
	defer jwksServer.Close()

	ownerID := uuid.New()
	tenantID := uuid.New()
	inactiveID := uuid.New()
	invalidRoleID := uuid.New()
	missingProfileID := uuid.New()

	repo := &mockProfileRepo{
		profiles: map[uuid.UUID]*Profile{
			ownerID:       {ID: ownerID, Role: RoleOwner, IsActive: true},
			tenantID:      {ID: tenantID, Role: RoleTenant, IsActive: true},
			inactiveID:    {ID: inactiveID, Role: RoleTenant, IsActive: false},
			invalidRoleID: {ID: invalidRoleID, Role: Role("ADMIN"), IsActive: true},
		},
	}

	verifier := NewSupabaseJWTVerifier(testIssuer, jwksServer.URL)
	router := setupAuthTestRouter(verifier, repo)

	t.Run("1. Missing Authorization header", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
	})

	t.Run("2. Malformed Bearer header", func(t *testing.T) {
		validToken := signTestJWT(t, primaryKey, primaryKid, baseClaims(tenantID.String(), boolPtr(true)))
		malformedHeaders := []string{
			"Basic abc123",
			"Bearer",
			"Bearer   ",
			"Bearer token-part-1 token-part-2",
			"Token " + validToken,
		}
		for _, hdr := range malformedHeaders {
			req := httptest.NewRequest(http.MethodGet, "/protected", nil)
			req.Header.Set("Authorization", hdr)
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)
			assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
		}

		// Token in query param must not be accepted.
		req := httptest.NewRequest(http.MethodGet, "/protected?token="+validToken, nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
	})

	t.Run("3. Invalid JWT signature", func(t *testing.T) {
		token := signTestJWT(t, wrongKey, primaryKid, baseClaims(tenantID.String(), boolPtr(true)))
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
	})

	t.Run("4. Expired JWT", func(t *testing.T) {
		claims := baseClaims(tenantID.String(), boolPtr(true))
		claims["exp"] = time.Now().Add(-5 * time.Minute).Unix()
		token := signTestJWT(t, primaryKey, primaryKid, claims)
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
	})

	t.Run("5. Invalid issuer", func(t *testing.T) {
		claims := baseClaims(tenantID.String(), boolPtr(true))
		claims["iss"] = "https://evil.supabase.co/auth/v1"
		token := signTestJWT(t, primaryKey, primaryKid, claims)
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
	})

	t.Run("6. Invalid audience", func(t *testing.T) {
		claims := baseClaims(tenantID.String(), boolPtr(true))
		claims["aud"] = "anon"
		token := signTestJWT(t, primaryKey, primaryKid, claims)
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
	})

	t.Run("7. Unknown signing key (kid)", func(t *testing.T) {
		token := signTestJWT(t, primaryKey, "unknown-kid", baseClaims(tenantID.String(), boolPtr(true)))
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
	})

	t.Run("8. Invalid UUID in sub", func(t *testing.T) {
		token := signTestJWT(t, primaryKey, primaryKid, baseClaims("not-a-uuid", boolPtr(true)))
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
	})

	t.Run("9. Unverified email (false, omitted, or only in user_metadata)", func(t *testing.T) {
		// Explicit false
		t1 := signTestJWT(t, primaryKey, primaryKid, baseClaims(tenantID.String(), boolPtr(false)))
		// Omitted top-level claim, even if user_metadata claims true
		claimsWithMeta := baseClaims(tenantID.String(), nil)
		claimsWithMeta["user_metadata"] = map[string]any{"email_verified": true}
		t2 := signTestJWT(t, primaryKey, primaryKid, claimsWithMeta)

		for _, tok := range []string{t1, t2} {
			req := httptest.NewRequest(http.MethodGet, "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+tok)
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)
			assertErrorResponse(t, rec, http.StatusForbidden, "EMAIL_VERIFICATION_REQUIRED")
		}
	})

	t.Run("10. Profile not found", func(t *testing.T) {
		token := signTestJWT(t, primaryKey, primaryKid, baseClaims(missingProfileID.String(), boolPtr(true)))
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
	})

	t.Run("11. Inactive profile", func(t *testing.T) {
		token := signTestJWT(t, primaryKey, primaryKid, baseClaims(inactiveID.String(), boolPtr(true)))
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusForbidden, "FORBIDDEN")
	})

	t.Run("12. Invalid profile role", func(t *testing.T) {
		token := signTestJWT(t, primaryKey, primaryKid, baseClaims(invalidRoleID.String(), boolPtr(true)))
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusForbidden, "FORBIDDEN")
	})

	t.Run("13. Valid OWNER authentication", func(t *testing.T) {
		claims := baseClaims(ownerID.String(), boolPtr(true))
		// Client-supplied user_metadata role must be ignored in favor of DB role.
		claims["user_metadata"] = map[string]any{"role": "TENANT"}
		token := signTestJWT(t, primaryKey, primaryKid, claims)

		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d (body=%s)", rec.Code, rec.Body.String())
		}
		var body struct {
			UserID        string `json:"user_id"`
			Role          Role   `json:"role"`
			EmailVerified bool   `json:"email_verified"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("decoding body: %v", err)
		}
		if body.UserID != ownerID.String() || body.Role != RoleOwner || !body.EmailVerified {
			t.Fatalf("unexpected auth context: %+v", body)
		}
	})

	t.Run("14. Valid TENANT authentication", func(t *testing.T) {
		token := signTestJWT(t, primaryKey, primaryKid, baseClaims(tenantID.String(), boolPtr(true)))
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d (body=%s)", rec.Code, rec.Body.String())
		}
		var body struct {
			UserID        string `json:"user_id"`
			Role          Role   `json:"role"`
			EmailVerified bool   `json:"email_verified"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("decoding body: %v", err)
		}
		if body.UserID != tenantID.String() || body.Role != RoleTenant || !body.EmailVerified {
			t.Fatalf("unexpected auth context: %+v", body)
		}
	})

	t.Run("Database failure returns 500 without leaking SQL details", func(t *testing.T) {
		errRepo := &mockProfileRepo{err: errors.New("pq: connection refused to 10.0.0.5:5432")}
		errRouter := setupAuthTestRouter(verifier, errRepo)
		token := signTestJWT(t, primaryKey, primaryKid, baseClaims(tenantID.String(), boolPtr(true)))

		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		errRouter.ServeHTTP(rec, req)

		assertErrorResponse(t, rec, http.StatusInternalServerError, "INTERNAL_ERROR")
	})
}

func TestJWKSCachingAndRefreshOnKeyRotation(t *testing.T) {
	key1 := generateECKeyPair(t)
	key2 := generateECKeyPair(t)

	var activeRotated atomic.Bool
	var fetchCount atomic.Int32

	jwksServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fetchCount.Add(1)
		w.Header().Set("Content-Type", "application/json")
		keys := []jwkKey{ecPublicKeyToJWK("kid-1", &key1.PublicKey)}
		if activeRotated.Load() {
			keys = append(keys, ecPublicKeyToJWK("kid-2", &key2.PublicKey))
		}
		_ = json.NewEncoder(w).Encode(jwksDocument{Keys: keys})
	}))
	defer jwksServer.Close()

	tenantID := uuid.New()
	repo := &mockProfileRepo{
		profiles: map[uuid.UUID]*Profile{
			tenantID: {ID: tenantID, Role: RoleTenant, IsActive: true},
		},
	}

	verifier := NewSupabaseJWTVerifier(testIssuer, jwksServer.URL)
	router := setupAuthTestRouter(verifier, repo)

	token1 := signTestJWT(t, key1, "kid-1", baseClaims(tenantID.String(), boolPtr(true)))

	// First request populates cache.
	req1 := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req1.Header.Set("Authorization", "Bearer "+token1)
	rec1 := httptest.NewRecorder()
	router.ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusOK {
		t.Fatalf("first request failed: %d %s", rec1.Code, rec1.Body.String())
	}
	if got := fetchCount.Load(); got != 1 {
		t.Fatalf("expected 1 JWKS fetch, got %d", got)
	}

	// Second request with same kid uses cache (no new HTTP fetch).
	req2 := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req2.Header.Set("Authorization", "Bearer "+token1)
	rec2 := httptest.NewRecorder()
	router.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("second request failed: %d %s", rec2.Code, rec2.Body.String())
	}
	if got := fetchCount.Load(); got != 1 {
		t.Fatalf("expected cached JWKS (still 1 fetch), got %d", got)
	}

	// Rotate key on server and send a request signed with kid-2.
	activeRotated.Store(true)
	token2 := signTestJWT(t, key2, "kid-2", baseClaims(tenantID.String(), boolPtr(true)))
	req3 := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req3.Header.Set("Authorization", "Bearer "+token2)
	rec3 := httptest.NewRecorder()
	router.ServeHTTP(rec3, req3)
	if rec3.Code != http.StatusOK {
		t.Fatalf("rotated key request failed: %d %s", rec3.Code, rec3.Body.String())
	}
	if got := fetchCount.Load(); got != 2 {
		t.Fatalf("expected JWKS refresh on unknown kid (2 fetches), got %d", got)
	}
}

type stubVerifier struct {
	claims *VerifiedClaims
	err    error
}

func (s *stubVerifier) Verify(_ context.Context, _ string) (*VerifiedClaims, error) {
	return s.claims, s.err
}

type nilProfileRepo struct{}

func (n *nilProfileRepo) GetProfileByID(_ context.Context, _ uuid.UUID) (*Profile, error) {
	return nil, nil
}

func TestRequireVerifiedUserDefensiveGuardsAndContextKey(t *testing.T) {
	t.Run("Nil claims with nil error returns 401 AUTH_REQUIRED", func(t *testing.T) {
		r := setupAuthTestRouter(&stubVerifier{claims: nil, err: nil}, &mockProfileRepo{})
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer any-token")
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusUnauthorized, "AUTH_REQUIRED")
	})

	t.Run("Nil profile with nil error returns 500 INTERNAL_ERROR", func(t *testing.T) {
		uid := uuid.New()
		r := setupAuthTestRouter(&stubVerifier{
			claims: &VerifiedClaims{UserID: uid, EmailVerified: true},
			err:    nil,
		}, &nilProfileRepo{})
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer any-token")
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		assertErrorResponse(t, rec, http.StatusInternalServerError, "INTERNAL_ERROR")
	})

	t.Run("GetAuthUser uses typed context key without string collision", func(t *testing.T) {
		gin.SetMode(gin.TestMode)
		uid := uuid.New()
		repo := &mockProfileRepo{
			profiles: map[uuid.UUID]*Profile{
				uid: {ID: uid, Role: RoleOwner, IsActive: true},
			},
		}

		r := gin.New()
		r.Use(func(c *gin.Context) {
			// Attempt to spoof via string key in Gin context or another typed key in request context.
			type decoyKey string
			c.Set("kostly.auth.user", AuthUser{UserID: uuid.New(), Role: RoleTenant})
			c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), decoyKey("kostly.auth.user"), AuthUser{UserID: uuid.New(), Role: RoleTenant}))
			c.Next()
		})
		r.GET("/check", RequireVerifiedUser(&stubVerifier{
			claims: &VerifiedClaims{UserID: uid, EmailVerified: true},
		}, repo), func(c *gin.Context) {
			user, ok := GetAuthUser(c)
			if !ok {
				t.Fatal("expected GetAuthUser to return true")
			}
			if user.UserID != uid || user.Role != RoleOwner || !user.EmailVerified {
				t.Fatalf("unexpected AuthUser retrieved: %+v", user)
			}
			c.Status(http.StatusOK)
		})

		req := httptest.NewRequest(http.MethodGet, "/check", nil)
		req.Header.Set("Authorization", "Bearer any-token")
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}

		// Empty context must return ok=false.
		emptyCtx, _ := gin.CreateTestContext(httptest.NewRecorder())
		emptyCtx.Request = httptest.NewRequest(http.MethodGet, "/", nil)
		if _, ok := GetAuthUser(emptyCtx); ok {
			t.Fatal("expected GetAuthUser to return false on unauthenticated context")
		}
	})
}
