package models

import "github.com/google/uuid"

type Review struct {
	Base
	ContractID  uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"contract_id"`
	ReviewerID  uuid.UUID `gorm:"type:uuid;not null;index" json:"reviewer_id"`
	RevieweeID  uuid.UUID `gorm:"type:uuid;not null;index" json:"reviewee_id"`
	Rating      int8      `gorm:"type:smallint;not null;check:rating >= 1 AND rating <= 5" json:"rating"`
	Comment     *string   `gorm:"type:text" json:"comment"`

	// associations
	Contract Contract `gorm:"foreignKey:ContractID" json:"contract,omitempty"`
	Reviewer User     `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
	Reviewee User     `gorm:"foreignKey:RevieweeID" json:"reviewee,omitempty"`
}