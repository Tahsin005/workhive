package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HttpOnly cookie.
func SetRefreshCookie(c *gin.Context, token string, days int, secure bool) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(
		"refresh_token",
		token,
		days*24*60*60, // MaxAge in seconds
		"/api/v1/auth", // scoped to auth endpoints only
		"",             // domain — empty = current host
		secure,         // Secure flag (false in dev, true in prod)
		true,           // HttpOnly
	)
}

func ClearRefreshCookie(c *gin.Context, secure bool) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("refresh_token", "", -1, "/api/v1/auth", "", secure, true)
}
