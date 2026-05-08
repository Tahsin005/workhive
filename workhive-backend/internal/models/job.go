package models

import "github.com/google/uuid"

type JobStatus string

const (
	JobStatusOpen        JobStatus = "open"
	JobStatusInProgress  JobStatus = "in_progress"
	JobStatusCompleted   JobStatus = "completed"
	JobStatusCancelled   JobStatus = "cancelled"
)

type Job struct {
	Base
	ClientID    uuid.UUID `gorm:"type:uuid;not null;index" json:"client_id"`
	Title       string    `gorm:"type:varchar(200);not null" json:"title"`
	Description string    `gorm:"type:text;not null" json:"description"`
	BudgetMin   float64   `gorm:"type:decimal(12,2);not null" json:"budget_min"`
	BudgetMax   float64   `gorm:"type:decimal(12,2);not null" json:"budget_max"`
	Category    string    `gorm:"type:varchar(100);not null;index" json:"category"`
	Status      JobStatus `gorm:"type:varchar(20);default:'open';index" json:"status"`

	// associations
	Client User `gorm:"foreignKey:ClientID" json:"client,omitempty"`
	Bids   []Bid `gorm:"foreignKey:JobID" json:"-"`
}