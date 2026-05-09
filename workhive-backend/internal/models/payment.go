package models

import (
	"time"

	"github.com/google/uuid"
)

type PaymentStatus string

const (
	PaymentStatusPending  PaymentStatus = "pending"
	PaymentStatusPaid     PaymentStatus = "paid"
	PaymentStatusFailed   PaymentStatus = "failed"
	PaymentStatusRefunded PaymentStatus = "refunded"
)

type Payment struct {
	Base
	ContractID      uuid.UUID     `gorm:"type:uuid;not null;index" json:"contract_id"`
	PayerID         uuid.UUID     `gorm:"type:uuid;not null;index" json:"payer_id"`
	Amount          float64       `gorm:"type:decimal(12,2);not null" json:"amount"`
	StripePaymentID *string       `gorm:"type:varchar(255);uniqueIndex" json:"stripe_payment_id"`
	Status          PaymentStatus `gorm:"type:varchar(20);default:'pending';index" json:"status"`
	PaidAt          *time.Time    `gorm:"default:null" json:"paid_at"`

	// associations
	Contract Contract `gorm:"foreignKey:ContractID" json:"contract,omitempty"`
	Payer    User     `gorm:"foreignKey:PayerID" json:"payer,omitempty"`
}