package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/Tahsin005/workhive-backend/internal/utils"
)

func AuthRequired(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			utils.Unauthorized(c, "Authorization header missing or malformed")
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := utils.ValidateToken(tokenStr, jwtSecret)
		if err != nil {
			utils.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		// set claims in context so handlers can access them
		c.Set("userID", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func RoleRequired(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			utils.Forbidden(c, "No role found")
			c.Abort()
			return
		}

		for _, r := range roles {
			if r == role.(string) {
				c.Next()
				return
			}
		}

		utils.Forbidden(c, "You don't have permission to access this resource")
		c.Abort()
	}
}