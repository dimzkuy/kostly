package database_test

import (
	"context"
	"testing"
	"time"

	"github.com/dimzkuy/kostly/internal/config"
	"github.com/dimzkuy/kostly/internal/database"
	"github.com/joho/godotenv"
)

func TestPostgresConnection(t *testing.T) {
	// Load .env from backend root if running from package directory
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load(".env")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("config.Load() failed: %v", err)
	}

	if cfg.DatabaseURL == "" {
		t.Skip("DATABASE_URL is not set; skipping live database connection test")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := database.New(ctx, cfg.DatabaseURL)
	if err != nil {
		t.Fatalf("database.New() failed: %v", err)
	}
	defer pool.Close()

	// Verify ping explicitly on the initialized pool
	pingCtx, pingCancel := context.WithTimeout(ctx, 5*time.Second)
	defer pingCancel()

	if err := pool.Ping(pingCtx); err != nil {
		t.Fatalf("pool.Ping() failed: %v", err)
	}

	stat := pool.Stat()
	t.Logf("PostgreSQL connection successful! TotalConns: %d, IdleConns: %d", stat.TotalConns(), stat.IdleConns())
}
