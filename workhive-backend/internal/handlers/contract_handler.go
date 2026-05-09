package handlers

import (
	"github.com/Tahsin005/workhive-backend/internal/dto"
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/services"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ContractHandler struct {
	contractService services.ContractService
}

func NewContractHandler(contractService services.ContractService) *ContractHandler {
	return &ContractHandler{contractService}
}

func (h *ContractHandler) ListMyContracts(c *gin.Context) {
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")

	var filter models.ContractFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.BadRequest(c, "Invalid query parameters", err.Error())
		return
	}

	// Filter by role
	if role == string(models.RoleClient) {
		filter.ClientID = userID.(uuid.UUID).String()
	} else if role == string(models.RoleFreelancer) {
		filter.FreelancerID = userID.(uuid.UUID).String()
	}

	contracts, total, err := h.contractService.ListContracts(filter)
	if err != nil {
		utils.InternalError(c, "Failed to fetch contracts")
		return
	}

	utils.PaginatedOK(c, "Contracts fetched successfully", dto.ToContractResponses(contracts), total, filter.Page, filter.Limit)
}

func (h *ContractHandler) GetContract(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	contract, err := h.contractService.GetContractByID(id, userID.(uuid.UUID))
	if err != nil {
		if err.Error() == "contract not found" {
			utils.NotFound(c, err.Error())
			return
		}
		if err.Error() == "unauthorized" {
			utils.Forbidden(c, "You don't have permission to view this contract")
			return
		}
		utils.InternalError(c, "Failed to fetch contract")
		return
	}

	utils.OK(c, "Contract fetched successfully", dto.ToContractResponse(contract))
}

func (h *ContractHandler) CompleteContract(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	contract, err := h.contractService.CompleteContract(id, userID.(uuid.UUID))
	if err != nil {
		switch err.Error() {
		case "contract not found":
			utils.NotFound(c, err.Error())
		case "unauthorized":
			utils.Forbidden(c, "You don't have permission to complete this contract")
		case "contract is not active":
			utils.BadRequest(c, err.Error(), nil)
		default:
			utils.InternalError(c, "Failed to complete contract")
		}
		return
	}

	utils.OK(c, "Contract marked as completed", dto.ToContractResponse(contract))
}

func (h *ContractHandler) CancelContract(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	contract, err := h.contractService.CancelContract(id, userID.(uuid.UUID))
	if err != nil {
		switch err.Error() {
		case "contract not found":
			utils.NotFound(c, err.Error())
		case "unauthorized":
			utils.Forbidden(c, "You don't have permission to cancel this contract")
		case "contract is not active":
			utils.BadRequest(c, err.Error(), nil)
		default:
			utils.InternalError(c, "Failed to cancel contract")
		}
		return
	}

	utils.OK(c, "Contract cancelled successfully", dto.ToContractResponse(contract))
}
