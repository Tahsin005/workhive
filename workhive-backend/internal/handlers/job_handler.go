package handlers

import (
	"github.com/Tahsin005/workhive-backend/internal/config"
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

	utils.Created(c, "Job created successfully", job)
}

func (h *JobHandler) ListJobs(c *gin.Context) {
	var filter models.JobFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.BadRequest(c, "Invalid query parameters", err.Error())
		return
	}

	jobs, total, err := h.jobService.ListJobs(filter)
	if err != nil {
		utils.InternalError(c, "Failed to fetch jobs")
		return
	}

	utils.PaginatedOK(c, "Jobs fetched successfully", jobs, total, filter.Page, filter.Limit)
}

func (h *JobHandler) GetJob(c *gin.Context) {
	id := c.Param("id")

	job, err := h.jobService.GetJobByID(id)
	if err != nil {
		utils.NotFound(c, "Job not found")
		return
	}

	utils.OK(c, "Job fetched successfully", job)
}
