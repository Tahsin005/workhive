package repository

import (
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MessageRepository interface {
	Create(msg *models.Message) error
	FindByContractID(contractID uuid.UUID) ([]models.Message, error)
	MarkAsRead(contractID uuid.UUID, readerID uuid.UUID) (int64, error)
	FindByIDWithSender(id uuid.UUID) (*models.Message, error)
}

type messageRepository struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) MessageRepository {
	return &messageRepository{db}
}

func (r *messageRepository) Create(msg *models.Message) error {
	return r.db.Create(msg).Error
}

func (r *messageRepository) FindByContractID(contractID uuid.UUID) ([]models.Message, error) {
	var messages []models.Message
	err := r.db.
		Where("contract_id = ?", contractID).
		Preload("Sender").
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}

func (r *messageRepository) MarkAsRead(contractID uuid.UUID, readerID uuid.UUID) (int64, error) {
	result := r.db.Model(&models.Message{}).
		Where("contract_id = ? AND sender_id != ? AND is_read = false", contractID, readerID).
		Update("is_read", true)
	return result.RowsAffected, result.Error
}

func (r *messageRepository) FindByIDWithSender(id uuid.UUID) (*models.Message, error) {
	var msg models.Message
	err := r.db.Preload("Sender").First(&msg, "id = ?", id).Error
	return &msg, err
}
