package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dimzkuy/kostly/internal/config"
)

func TestHealthEndpointRemainsPublic(t *testing.T) {
	cfg := &config.Config{
		AppEnv:             "test",
		CORSAllowedOrigins: "http://localhost:8081",
		SupabaseURL:        "https://example.supabase.co",
		SupabaseJWKSURL:    "https://example.supabase.co/auth/v1/.well-known/jwks.json",
	}

	r := New(cfg, nil)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected /health to return 200, got %d (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestMeEndpointRequiresAuthentication(t *testing.T) {
	cfg := &config.Config{
		AppEnv:             "test",
		CORSAllowedOrigins: "http://localhost:8081",
		SupabaseURL:        "https://example.supabase.co",
		SupabaseJWKSURL:    "https://example.supabase.co/auth/v1/.well-known/jwks.json",
	}

	r := New(cfg, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected /api/v1/me without token to return 401, got %d (body=%s)", rec.Code, rec.Body.String())
	}
}
