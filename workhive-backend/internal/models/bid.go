package models

import "github.com/google/uuid"

type BidStatus string

const (
	BidStatusPending   BidStatus = "pending"
	BidStatusAccepted  BidStatus = "accepted"
	BidStatusRejected  BidStatus = "rejected"
	BidStatusWithdrawn BidStatus = "withdrawn"
)

type Bid struct {
	Base
	JobID        uuid.UUID `gorm:"type:uuid;not null;index:idx_bid_job_freelancer" json:"job_id"`
	FreelancerID uuid.UUID `gorm:"type:uuid;not null;index:idx_bid_job_freelancer" json:"freelancer_id"`
	Amount       float64   `gorm:"type:decimal(12,2);not null" json:"amount"`
	CoverLetter  string    `gorm:"type:text;not null" json:"cover_letter"`
	Status       BidStatus `gorm:"type:varchar(20);default:'pending';index" json:"status"`

	// associations
	Job        Job  `gorm:"foreignKey:JobID" json:"job,omitempty"`
	Freelancer User `gorm:"foreignKey:FreelancerID" json:"freelancer,omitempty"`
}
