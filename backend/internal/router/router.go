package router

import (
	"net/http"

	"github.com/dimzkuy/kostly/internal/config"
	"github.com/dimzkuy/kostly/internal/middleware"
	"github.com/dimzkuy/kostly/internal/modules/auth"
	"github.com/dimzkuy/kostly/internal/shared/response"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// New creates and configures the Gin engine with middleware and routes.
// cfg controls Gin mode, CORS origins, and Supabase JWT verification settings.
// pool is injected here so that module constructors and auth middleware
// receive it without creating global database connections.
func New(cfg *config.Config, pool *pgxpool.Pool) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(cfg.CORSAllowedOrigins))

	// /health is intentionally outside /api/v1 so infrastructure probes
	// (load balancers, container orchestrators) can reach it without an
	// API version prefix.
	r.GET("/health", healthHandler)

	api := r.Group("/api/v1")
	_ = api // Public module routes (discovery, facilities) will be registered here.

	authMiddleware := middleware.RequireVerifiedUser(
		middleware.NewSupabaseJWTVerifier(cfg.SupabaseIssuer(), cfg.SupabaseJWKSURL),
		middleware.NewPostgresProfileRepository(pool),
	)
	protected := api.Group("")
	protected.Use(authMiddleware)

	authRepo := auth.NewRepository(pool)
	authService := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authService)
	protected.GET("/me", authHandler.GetMe)

	return r
}

func healthHandler(c *gin.Context) {
	response.Success(c, http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "kostly-api",
	})
}
