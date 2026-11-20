package validator

import (
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

// Setup configures custom validators on the Gin binding engine.
// Call this once during application initialization.
func Setup() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		_ = v // Register custom validations here as modules are built.
	}
}
