package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"gorm.io/gorm"
)

type HealthHandler struct {
	DB *gorm.DB
}

func NewHealthHandler(db *gorm.DB) *HealthHandler {
	return &HealthHandler{DB: db}
}

func (h *HealthHandler) Check(c *gin.Context) {
	sqlDB, err := h.DB.DB()
	if err != nil {
		utils.InternalError(c, "Database unreachable")
		return
	}

	if err := sqlDB.Ping(); err != nil {
		utils.InternalError(c, "Database ping failed")
		return
	}

	utils.OK(c, "Server is healthy", gin.H{
		"database": "connected",
	})
}