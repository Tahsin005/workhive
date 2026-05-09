package services

import (
	"errors"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/google/uuid"
)

type MessageService interface {
	GetHistory(userID uuid.UUID, contractID uuid.UUID) ([]models.Message, error)
	SendMessage(userID uuid.UUID, contractID uuid.UUID, content string) (*models.Message, error)
	MarkAsRead(userID uuid.UUID, contractID uuid.UUID) (int64, error)
}

type messageService struct {
	messageRepo  repository.MessageRepository
	contractRepo repository.ContractRepository
}

func NewMessageService(messageRepo repository.MessageRepository, contractRepo repository.ContractRepository) MessageService {
	return &messageService{messageRepo, contractRepo}
}

// getAuthorizedContract fetches the contract and checks user is a participant.
func (s *messageService) getAuthorizedContract(userID uuid.UUID, contractID uuid.UUID) (*models.Contract, error) {
	contract, err := s.contractRepo.GetByID(contractID.String())
	if err != nil {
		return nil, errors.New("contract not found")
	}
	if contract.ClientID != userID && contract.FreelancerID != userID {
		return nil, errors.New("forbidden")
	}
	return contract, nil
}

func (s *messageService) GetHistory(userID uuid.UUID, contractID uuid.UUID) ([]models.Message, error) {
	if _, err := s.getAuthorizedContract(userID, contractID); err != nil {
		return nil, err
	}
	return s.messageRepo.FindByContractID(contractID)
}

func (s *messageService) SendMessage(userID uuid.UUID, contractID uuid.UUID, content string) (*models.Message, error) {
	contract, err := s.getAuthorizedContract(userID, contractID)
	if err != nil {
		return nil, err
	}
	if contract.Status != models.ContractStatusActive {
		return nil, errors.New("contract is not active")
	}

	msg := &models.Message{
		ContractID: contractID,
		SenderID:   userID,
		Content:    content,
		IsRead:     false,
	}
	if err := s.messageRepo.Create(msg); err != nil {
		return nil, err
	}

	// Reload with sender preloaded for the response
	return s.messageRepo.FindByIDWithSender(msg.ID)
}

func (s *messageService) MarkAsRead(userID uuid.UUID, contractID uuid.UUID) (int64, error) {
	if _, err := s.getAuthorizedContract(userID, contractID); err != nil {
		return 0, err
	}
	return s.messageRepo.MarkAsRead(contractID, userID)
}
