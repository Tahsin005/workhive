package handlers

import (
	"github.com/Tahsin005/workhive-backend/internal/services"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DashboardHandler struct {
	dashboardService services.DashboardService
}

func NewDashboardHandler(dashboardService services.DashboardService) *DashboardHandler {
	return &DashboardHandler{
		dashboardService: dashboardService,
	}
}

func (h *DashboardHandler) GetClientDashboard(c *gin.Context) {
	userID, _ := c.Get("userID")

	dashboard, err := h.dashboardService.GetClientDashboard(userID.(uuid.UUID))
	if err != nil {
		utils.InternalError(c, "Failed to fetch client dashboard data")
		return
	}

	utils.OK(c, "Client dashboard data fetched successfully", dashboard)
}

func (h *DashboardHandler) GetFreelancerDashboard(c *gin.Context) {
	userID, _ := c.Get("userID")

	dashboard, err := h.dashboardService.GetFreelancerDashboard(userID.(uuid.UUID))
	if err != nil {
		utils.InternalError(c, "Failed to fetch freelancer dashboard data")
		return
	}

	utils.OK(c, "Freelancer dashboard data fetched successfully", dashboard)
}
