package dto

import (
	"time"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
)

type PaymentResponse struct {
	ID              uuid.UUID            `json:"id"`
	ContractID      uuid.UUID            `json:"contract_id"`
	Amount          float64              `json:"amount"`
	Status          models.PaymentStatus `json:"status"`
	StripePaymentID *string              `json:"stripe_payment_id,omitempty"`
	PaidAt          *time.Time           `json:"paid_at,omitempty"`
	CreatedAt       time.Time            `json:"created_at"`
	Payer           *UserBrief           `json:"payer,omitempty"`
}

type PaymentIntentResponse struct {
	ClientSecret string    `json:"client_secret"`
	PaymentID    uuid.UUID `json:"payment_id"`
	Amount       float64   `json:"amount"`
	Currency     string    `json:"currency"`
}

func ToPaymentResponse(payment *models.Payment) *PaymentResponse {
	if payment == nil {
		return nil
	}
	response := &PaymentResponse{
		ID:              payment.ID,
		ContractID:      payment.ContractID,
		Amount:          payment.Amount,
		Status:          payment.Status,
		StripePaymentID: payment.StripePaymentID,
		PaidAt:          payment.PaidAt,
		CreatedAt:       payment.CreatedAt,
	}

	if payment.Payer.ID != uuid.Nil {
		response.Payer = ToUserBrief(&payment.Payer)
	}

	return response
}

func ToPaymentResponses(payments []models.Payment) []*PaymentResponse {
	responses := make([]*PaymentResponse, len(payments))
	for i, payment := range payments {
		responses[i] = ToPaymentResponse(&payment)
	}
	return responses
}
