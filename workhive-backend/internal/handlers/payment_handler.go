package handlers

import (
	"io"
	"log"

	"github.com/Tahsin005/workhive-backend/internal/dto"
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/services"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type PaymentHandler struct {
	paymentService services.PaymentService
	validate       *validator.Validate
}

func NewPaymentHandler(paymentService services.PaymentService) *PaymentHandler {
	return &PaymentHandler{
		paymentService: paymentService,
		validate:       validator.New(),
	}
}

func (h *PaymentHandler) CreateIntent(c *gin.Context) {
	userID, _ := c.Get("userID")

	var input models.CreatePaymentIntentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}

	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	intent, err := h.paymentService.CreateIntent(userID.(uuid.UUID), input)
	if err != nil {
		switch err.Error() {
		case "invalid contract ID", "contract not found":
			utils.NotFound(c, err.Error())
		case "unauthorized":
			utils.Forbidden(c, "You don't have permission to perform this action")
		case "contract is not active", "a pending or paid payment already exists for this contract":
			utils.BadRequest(c, err.Error(), nil)
		default:
			utils.InternalError(c, "Failed to create payment intent")
		}
		return
	}

	utils.Created(c, "Payment intent created", intent)
}

func (h *PaymentHandler) HandleWebhook(c *gin.Context) {
	// read raw body directly from request — bypass Gin's body handling
	rawBody, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Failed to read raw body: %v\n", err)
		utils.BadRequest(c, "Failed to read request body", nil)
		return
	}
	defer c.Request.Body.Close()

	signature := c.GetHeader("Stripe-Signature")
	if signature == "" {
		log.Println("Missing Stripe signature")
		utils.BadRequest(c, "Missing Stripe signature", nil)
		return
	}


	if err := h.paymentService.HandleWebhook(rawBody, signature); err != nil {
		utils.BadRequest(c, "Webhook error", err.Error())
		return
	}

	c.JSON(200, gin.H{"received": true})
}

func (h *PaymentHandler) GetByContractID(c *gin.Context) {
	contractIDStr := c.Param("id")
	contractID, err := uuid.Parse(contractIDStr)
	if err != nil {
		utils.BadRequest(c, "Invalid contract ID", err.Error())
		return
	}

	userID, _ := c.Get("userID")

	payments, err := h.paymentService.GetByContractID(userID.(uuid.UUID), contractID)
	if err != nil {
		if err.Error() == "contract not found" {
			utils.NotFound(c, err.Error())
			return
		}
		if err.Error() == "unauthorized" {
			utils.Forbidden(c, "You don't have permission to view these payments")
			return
		}
		utils.InternalError(c, "Failed to fetch payments")
		return
	}

	utils.OK(c, "Payments fetched successfully", dto.ToPaymentResponses(payments))
}

func (h *PaymentHandler) ListMyPayments(c *gin.Context) {
	userID, _ := c.Get("userID")

	page := utils.GetQueryInt(c, "page", 1)
	limit := utils.GetQueryInt(c, "limit", 10)

	payments, total, err := h.paymentService.ListMyPayments(userID.(uuid.UUID), page, limit)
	if err != nil {
		utils.InternalError(c, "Failed to fetch payments")
		return
	}

	utils.PaginatedOK(c, "Payments fetched successfully", dto.ToPaymentResponses(payments), total, page, limit)
}
