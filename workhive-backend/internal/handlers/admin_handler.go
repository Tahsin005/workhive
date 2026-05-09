package handlers

import (
	"strconv"
	"strings"

	"github.com/Tahsin005/workhive-backend/internal/dto"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/Tahsin005/workhive-backend/internal/services"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type AdminHandler struct {
	service     services.AdminService
	validate    *validator.Validate
	adminSecret string
}

func NewAdminHandler(service services.AdminService, validate *validator.Validate, adminSecret string) *AdminHandler {
	return &AdminHandler{service, validate, adminSecret}
}

func parsePagination(c *gin.Context) (int, int) {
	page := 1
	if p, err := strconv.Atoi(c.Query("page")); err == nil && p > 0 {
		page = p
	}

	limit := 10
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 {
		limit = l
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	page, limit := parsePagination(c)

	filters := repository.AdminUserFilters{
		Role:   c.Query("role"),
		Search: c.Query("search"),
	}

	if isActiveStr := c.Query("is_active"); isActiveStr != "" {
		isActive := strings.ToLower(isActiveStr) == "true"
		filters.IsActive = &isActive
	}

	users, total, err := h.service.ListUsers(filters, page, limit)
	if err != nil {
		utils.InternalError(c, "Failed to fetch users")
		return
	}

	var data []dto.AdminUserResponse
	for _, u := range users {
		data = append(data, dto.ToAdminUserResponse(u))
	}

	utils.PaginatedOK(c, "Users fetched successfully", data, total, page, limit)
}

func (h *AdminHandler) GetUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "Invalid user ID", nil)
		return
	}

	user, stats, err := h.service.GetUser(id)
	if err != nil {
		if err.Error() == "user not found" {
			utils.NotFound(c, "User not found")
		} else {
			utils.InternalError(c, "Failed to fetch user")
		}
		return
	}

	data := dto.ToAdminUserDetailResponse(*user, stats.TotalJobs, stats.TotalBids, stats.TotalContracts)
	utils.OK(c, "User fetched successfully", data)
}

func (h *AdminHandler) BanUser(c *gin.Context) {
	adminID := c.MustGet("userID").(uuid.UUID)
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "Invalid target user ID", nil)
		return
	}

	user, err := h.service.BanUser(adminID, targetID)
	if err != nil {
		switch err.Error() {
		case "cannot ban yourself":
			utils.BadRequest(c, "You cannot ban your own account", nil)
		case "cannot ban an admin":
			utils.Forbidden(c, "Admin accounts cannot be banned")
		case "user not found":
			utils.NotFound(c, "User not found")
		default:
			utils.InternalError(c, "Failed to toggle user ban status")
		}
		return
	}

	msg := "User unbanned successfully"
	if !user.IsActive {
		msg = "User banned successfully"
	}

	utils.OK(c, msg, dto.ToAdminUserResponse(*user))
}

func (h *AdminHandler) DeleteUser(c *gin.Context) {
	adminID := c.MustGet("userID").(uuid.UUID)
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "Invalid target user ID", nil)
		return
	}

	err = h.service.DeleteUser(adminID, targetID)
	if err != nil {
		switch err.Error() {
		case "cannot delete yourself":
			utils.BadRequest(c, "You cannot delete your own account", nil)
		case "cannot delete an admin":
			utils.Forbidden(c, "Admin accounts cannot be deleted")
		case "user not found":
			utils.NotFound(c, "User not found")
		case "cannot delete user with active contracts":
			utils.BadRequest(c, "Cannot delete user with active contracts", nil)
		default:
			utils.InternalError(c, "Failed to delete user")
		}
		return
	}

	utils.OK(c, "User deleted successfully", nil)
}

func (h *AdminHandler) ListJobs(c *gin.Context) {
	page, limit := parsePagination(c)

	filters := repository.AdminJobFilters{
		Status:   c.Query("status"),
		Category: c.Query("category"),
		Search:   c.Query("search"),
	}

	jobs, total, err := h.service.ListJobs(filters, page, limit)
	if err != nil {
		utils.InternalError(c, "Failed to fetch jobs")
		return
	}

	var data []dto.AdminJobResponse
	for _, j := range jobs {
		bidCount, _ := h.service.CountBidsForJob(j.ID) // ignoring error for simplicity in list view
		data = append(data, dto.ToAdminJobResponse(j, bidCount))
	}

	// For empty slices, return an empty array instead of null
	if data == nil {
		data = []dto.AdminJobResponse{}
	}

	utils.PaginatedOK(c, "Jobs fetched successfully", data, total, page, limit)
}

func (h *AdminHandler) DeleteJob(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "Invalid job ID", nil)
		return
	}

	err = h.service.DeleteJob(id)
	if err != nil {
		switch err.Error() {
		case "job not found":
			utils.NotFound(c, "Job not found")
		case "cannot delete job with active contract":
			utils.BadRequest(c, "Cannot delete a job with an active contract", nil)
		default:
			utils.InternalError(c, "Failed to delete job")
		}
		return
	}

	utils.OK(c, "Job deleted successfully", nil)
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	stats, err := h.service.GetStats()
	if err != nil {
		utils.InternalError(c, "Failed to fetch stats")
		return
	}

	utils.OK(c, "Stats fetched successfully", gin.H{
		"users": gin.H{
			"total":       stats.TotalUsers,
			"clients":     stats.TotalClients,
			"freelancers": stats.TotalFreelancers,
		},
		"jobs": gin.H{
			"total": stats.TotalJobs,
			"open":  stats.OpenJobs,
		},
		"contracts": gin.H{
			"total":     stats.TotalContracts,
			"active":    stats.ActiveContracts,
			"completed": stats.CompletedContracts,
		},
		"revenue": gin.H{
			"total_paid":    stats.TotalRevenue,
			"total_pending": stats.PendingRevenue,
		},
	})
}

func (h *AdminHandler) PromoteToAdmin(c *gin.Context) {
	if h.adminSecret == "" {
		utils.InternalError(c, "Admin promotion is not configured")
		return
	}

	email := c.Param("email")
	secret := c.Param("secret")

	if secret != h.adminSecret {
		utils.Forbidden(c, "Invalid secret")
		return
	}

	user, err := h.service.PromoteToAdmin(email)
	if err != nil {
		switch err.Error() {
		case "user not found":
			utils.NotFound(c, "No user found with that email")
		case "user is already an admin":
			utils.BadRequest(c, "User is already an admin", nil)
		default:
			utils.InternalError(c, "Failed to promote user")
		}
		return
	}

	utils.OK(c, "User promoted to admin successfully", dto.ToAdminUserResponse(*user))
}
