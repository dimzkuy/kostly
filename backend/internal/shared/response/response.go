package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Success sends a standard JSON success response.
func Success(c *gin.Context, statusCode int, data any) {
	c.JSON(statusCode, gin.H{"data": data})
}

// Error sends a standard JSON error response.
func Error(c *gin.Context, statusCode int, code string, message string) {
	c.JSON(statusCode, gin.H{
		"error": gin.H{
			"code":    code,
			"message": message,
		},
	})
}

// ErrorWithDetails sends a standard JSON error response with field-level details.
func ErrorWithDetails(c *gin.Context, statusCode int, code string, message string, details map[string]string) {
	c.JSON(statusCode, gin.H{
		"error": gin.H{
			"code":    code,
			"message": message,
			"details": details,
		},
	})
}

// InternalError sends a 500 error response.
func InternalError(c *gin.Context) {
	Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred.")
}
