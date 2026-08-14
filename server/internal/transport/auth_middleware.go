package transport

import (
	"net/http"
	"os"
	"strings"

	"chambu/server/internal/utils"

	"github.com/gin-gonic/gin"
)

func AdminTokenOrJWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		adminToken := os.Getenv("ADMIN_TOKEN")
		if adminToken != "" && c.GetHeader("X-Admin-Token") == adminToken {
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		c.Set("admin_id", claims.AdminID)
		c.Set("role", claims.Role)
		c.Next()
	}
}
