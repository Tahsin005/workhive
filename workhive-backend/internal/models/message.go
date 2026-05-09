package models

import "github.com/google/uuid"

type Message struct {
	Base
	ContractID uuid.UUID `gorm:"type:uuid;not null;index" json:"contract_id"`
	SenderID   uuid.UUID `gorm:"type:uuid;not null;index" json:"sender_id"`
	Content    string    `gorm:"type:text;not null" json:"content"`
	IsRead     bool      `gorm:"default:false" json:"is_read"`

	// associations
	Contract Contract `gorm:"foreignKey:ContractID" json:"contract,omitempty"`
	Sender   User     `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
}