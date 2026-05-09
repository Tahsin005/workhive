package handlers

import (
	"github.com/Tahsin005/workhive-backend/internal/config"
	"github.com/Tahsin005/workhive-backend/internal/dto"
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/services"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type JobHandler struct {
	jobService services.JobService
	cfg        *config.Config
	validate   *validator.Validate
}

func NewJobHandler(jobService services.JobService, cfg *config.Config) *JobHandler {
	return &JobHandler{
		jobService: jobService,
		cfg:        cfg,
		validate:   validator.New(),
	}
}

func (h *JobHandler) CreateJob(c *gin.Context) {
	userID, _ := c.Get("userID")

	var input models.CreateJobInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}
	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	job, err := h.jobService.CreateJob(input, userID.(uuid.UUID))
	if err != nil {
		utils.InternalError(c, "Failed to create job")
		return
	}

	utils.Created(c, "Job created successfully", dto.ToJobResponse(job))
}

func (h *JobHandler) ListJobs(c *gin.Context) {
	var filter models.JobFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.BadRequest(c, "Invalid query parameters", err.Error())
		return
	}

	// validate budget range
	if filter.MinPrice > 0 && filter.MaxPrice > 0 && filter.MinPrice > filter.MaxPrice {
		utils.BadRequest(c, "budget_min cannot be greater than budget_max", nil)
		return
	}

	// public listing only shows open jobs
	filter.Status = "open"

	// cap limit at 50
	if filter.Limit > 50 {
		filter.Limit = 50
	}

	jobs, total, err := h.jobService.ListJobs(filter)
	if err != nil {
		utils.InternalError(c, "Failed to fetch jobs")
		return
	}

	utils.PaginatedOK(c, "Jobs fetched successfully", dto.ToJobResponses(jobs), total, filter.Page, filter.Limit)
}

func (h *JobHandler) GetJob(c *gin.Context) {
	id := c.Param("id")

	job, err := h.jobService.GetJobByID(id)
	if err != nil {
		utils.NotFound(c, "Job not found")
		return
	}

	utils.OK(c, "Job fetched successfully", dto.ToJobResponse(job))
}

func (h *JobHandler) UpdateJob(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	var input models.UpdateJobInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}
	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	job, err := h.jobService.UpdateJob(id, input, userID.(uuid.UUID))
	if err != nil {
		switch err.Error() {
		case "job not found":
			utils.NotFound(c, "Job not found")
		case "unauthorized":
			utils.Forbidden(c, "You don't have permission to update this job")
		case "job is not open for editing":
			utils.BadRequest(c, "Only open jobs can be edited", nil)
		default:
			utils.InternalError(c, "Failed to update job")
		}
		return
	}

	utils.OK(c, "Job updated successfully", dto.ToJobResponse(job))
}

func (h *JobHandler) DeleteJob(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	if err := h.jobService.DeleteJob(id, userID.(uuid.UUID)); err != nil {
		switch err.Error() {
		case "job not found":
			utils.NotFound(c, "Job not found")
		case "unauthorized":
			utils.Forbidden(c, "You don't have permission to delete this job")
		case "cannot delete a job with an accepted bid or active contract":
			utils.BadRequest(c, err.Error(), nil)
		default:
			utils.InternalError(c, "Failed to delete job")
		}
		return
	}

	utils.OK(c, "Job deleted successfully", nil)
}

func (h *JobHandler) ListMyJobs(c *gin.Context) {
	userID, _ := c.Get("userID")

	var filter models.JobFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.BadRequest(c, "Invalid query parameters", err.Error())
		return
	}

	filter.ClientID = userID.(uuid.UUID).String()

	jobs, total, err := h.jobService.ListJobs(filter)
	if err != nil {
		utils.InternalError(c, "Failed to fetch jobs")
		return
	}

	utils.PaginatedOK(c, "Jobs fetched successfully", dto.ToJobResponses(jobs), total, filter.Page, filter.Limit)
}
