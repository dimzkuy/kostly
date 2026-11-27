package auth

import (
	"errors"
	"net/http"

	"github.com/dimzkuy/kostly/internal/middleware"
	"github.com/dimzkuy/kostly/internal/shared/response"
	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for the auth module.
type Handler struct {
	service Service
}

// NewHandler creates an auth Handler with the given Service.
func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// GetMe handles GET /api/v1/me and returns the authenticated caller's profile.
func (h *Handler) GetMe(c *gin.Context) {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "AUTH_REQUIRED", "Authentication required.")
		return
	}

	me, err := h.service.GetMe(c.Request.Context(), authUser)
	if err != nil {
		if errors.Is(err, ErrProfileNotFound) {
			response.Error(c, http.StatusNotFound, "RESOURCE_NOT_FOUND", "User profile not found.")
			return
		}
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, me)
}
