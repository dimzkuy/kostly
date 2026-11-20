package router

import (
	"net/http"

	"github.com/dimzkuy/kostly/internal/middleware"
	"github.com/dimzkuy/kostly/internal/shared/response"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// New creates and configures the Gin engine with middleware and routes.
// appEnv controls the Gin mode: "production" uses gin.ReleaseMode, anything
// else uses gin.DebugMode. This must be set before gin.New() is called.
// pool is injected here so that future module constructors receive it through
// this function without needing to touch main.go.
func New(appEnv string, pool *pgxpool.Pool, corsAllowedOrigins string) *gin.Engine {
	if appEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(corsAllowedOrigins))

	// /health is intentionally outside /api/v1 so infrastructure probes
	// (load balancers, container orchestrators) can reach it without an
	// API version prefix.
	r.GET("/health", healthHandler)

	api := r.Group("/api/v1")
	_ = api  // Module routes will be registered here.
	_ = pool // Pool will be passed to module constructors as they are added.

	return r
}

func healthHandler(c *gin.Context) {
	response.Success(c, http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "kostly-api",
	})
}
