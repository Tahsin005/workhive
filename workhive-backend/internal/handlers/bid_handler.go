package handlers

import (
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/services"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type BidHandler struct {
	bidService services.BidService
	validate   *validator.Validate
}

func NewBidHandler(bidService services.BidService) *BidHandler {
	return &BidHandler{
		bidService: bidService,
		validate:   validator.New(),
	}
}

func (h *BidHandler) SubmitBid(c *gin.Context) {
	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		utils.BadRequest(c, "Invalid job ID", err.Error())
		return
	}

	userID, _ := c.Get("userID")
	freelancerID := userID.(uuid.UUID)

	var input models.SubmitBidInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}

	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	bid, err := h.bidService.SubmitBid(jobID, freelancerID, input)
	if err != nil {
		switch err.Error() {
		case "job not found":
			utils.NotFound(c, err.Error())
		case "job is not open for bidding", "you cannot bid on your own job":
			utils.BadRequest(c, err.Error(), nil)
		case "you have already bid on this job":
			utils.Conflict(c, err.Error())
		default:
			utils.InternalError(c, "Failed to submit bid")
		}
		return
	}

	utils.Created(c, "Bid submitted successfully", bid)
}

func (h *BidHandler) ListMyBids(c *gin.Context) {
	userID, _ := c.Get("userID")

	var filter models.BidFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.BadRequest(c, "Invalid query parameters", err.Error())
		return
	}

	filter.FreelancerID = userID.(uuid.UUID).String()

	bids, total, err := h.bidService.ListBids(filter)
	if err != nil {
		utils.InternalError(c, "Failed to fetch bids")
		return
	}

	utils.PaginatedOK(c, "Bids fetched successfully", bids, total, filter.Page, filter.Limit)
}

func (h *BidHandler) UpdateBid(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	var input models.UpdateBidInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}

	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	bid, err := h.bidService.UpdateBid(id, userID.(uuid.UUID), input)
	if err != nil {
		switch err.Error() {
		case "bid not found":
			utils.NotFound(c, err.Error())
		case "unauthorized":
			utils.Forbidden(c, "You don't have permission to update this bid")
		case "cannot update bid that is not pending":
			utils.BadRequest(c, err.Error(), nil)
		default:
			utils.InternalError(c, "Failed to update bid")
		}
		return
	}

	utils.OK(c, "Bid updated successfully", bid)
}

func (h *BidHandler) WithdrawBid(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	if err := h.bidService.WithdrawBid(id, userID.(uuid.UUID)); err != nil {
		switch err.Error() {
		case "bid not found":
			utils.NotFound(c, err.Error())
		case "unauthorized":
			utils.Forbidden(c, "You don't have permission to withdraw this bid")
		case "cannot withdraw bid that is not pending":
			utils.BadRequest(c, err.Error(), nil)
		default:
			utils.InternalError(c, "Failed to withdraw bid")
		}
		return
	}

	utils.OK(c, "Bid withdrawn successfully", nil)
}
