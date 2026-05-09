package models

import (
	"time"

	"github.com/google/uuid"
)

type ContractStatus string

const (
	ContractStatusActive    ContractStatus = "active"
	ContractStatusCompleted ContractStatus = "completed"
	ContractStatusCancelled ContractStatus = "cancelled"
	ContractStatusDisputed  ContractStatus = "disputed"
)

type Contract struct {
	Base
	JobID        uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"job_id"`
	BidID        uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"bid_id"`
	ClientID     uuid.UUID      `gorm:"type:uuid;not null;index" json:"client_id"`
	FreelancerID uuid.UUID      `gorm:"type:uuid;not null;index" json:"freelancer_id"`
	Amount       float64        `gorm:"type:decimal(12,2);not null" json:"amount"`
	Status       ContractStatus `gorm:"type:varchar(20);default:'active';index" json:"status"`
	StartedAt    time.Time      `gorm:"not null;default:now()" json:"started_at"`
	CompletedAt  *time.Time     `gorm:"default:null" json:"completed_at"`

	// associations
	Job        Job  `gorm:"foreignKey:JobID" json:"job,omitempty"`
	Bid        Bid  `gorm:"foreignKey:BidID" json:"bid,omitempty"`
	Client     User `gorm:"foreignKey:ClientID" json:"client,omitempty"`
	Freelancer User `gorm:"foreignKey:FreelancerID" json:"freelancer,omitempty"`
	Payments   []Payment `gorm:"foreignKey:ContractID" json:"-"`
}
