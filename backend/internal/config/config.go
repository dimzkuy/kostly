package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	AppEnv      string
	AppPort     string
	DatabaseURL string

	SupabaseURL     string
	SupabaseJWKSURL string

	CORSAllowedOrigins string
}

// Load reads environment variables and returns a validated Config.
// It loads a .env file if present but does not fail if the file is missing.
// A malformed .env file (as opposed to a missing one) is treated as an error.
func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		// godotenv returns a plain error message for missing files; only surface
		// actual parse/IO failures, not "file not found".
		if !strings.Contains(err.Error(), "no such file") {
			return nil, fmt.Errorf("loading .env file: %w", err)
		}
	}

	cfg := &Config{
		AppEnv:             getEnv("APP_ENV", "development"),
		AppPort:            getEnv("APP_PORT", "8080"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		SupabaseURL:        os.Getenv("SUPABASE_URL"),
		SupabaseJWKSURL:    os.Getenv("SUPABASE_JWKS_URL"),
		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:8081"),
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// validate collects all missing required variables and returns them in one error.
func (c *Config) validate() error {
	var missing []string

	if c.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if c.SupabaseURL == "" {
		missing = append(missing, "SUPABASE_URL")
	}
	if c.SupabaseJWKSURL == "" {
		missing = append(missing, "SUPABASE_JWKS_URL")
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}

	return nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

// SupabaseIssuer returns the expected JWT issuer URL for the configured Supabase project.
func (c *Config) SupabaseIssuer() string {
	return strings.TrimRight(c.SupabaseURL, "/") + "/auth/v1"
}
