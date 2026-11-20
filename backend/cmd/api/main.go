package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/dimzkuy/kostly/internal/config"
	"github.com/dimzkuy/kostly/internal/database"
	"github.com/dimzkuy/kostly/internal/router"
	"github.com/dimzkuy/kostly/internal/shared/validator"
)

func main() {
	// Load and validate configuration.
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	// Initialize custom validators against the Gin binding engine.
	validator.Setup()

	// Connect to the database. The pool is closed on shutdown via defer.
	ctx := context.Background()
	pool, err := database.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()
	log.Println("database connection established")

	// Create the HTTP router. Gin mode and pool are set here so that
	// future module constructors receive their dependencies without
	// requiring further changes to main.go.
	r := router.New(cfg.AppEnv, pool, cfg.CORSAllowedOrigins)

	// Configure the HTTP server with explicit timeouts to guard against
	// slow clients. ReadHeaderTimeout prevents slow-loris-style attacks.
	srv := &http.Server{
		Addr:              ":" + cfg.AppPort,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Start the server in a goroutine so we can listen for shutdown signals.
	go func() {
		log.Printf("server starting on :%s (env=%s)", cfg.AppPort, cfg.AppEnv)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	// Block until an interrupt signal is received, then shut down gracefully.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()

	log.Println("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("server forced to shutdown: %v", err)
	}

	log.Println("server exited cleanly")
}
