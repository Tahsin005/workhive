package dto

import (
	"time"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
)

type MessageResponse struct {
	ID         uuid.UUID  `json:"id"`
	ContractID uuid.UUID  `json:"contract_id"`
	Content    string     `json:"content"`
	IsRead     bool       `json:"is_read"`
	CreatedAt  time.Time  `json:"created_at"`
	Sender     *UserBrief `json:"sender"`
}

func ToMessageResponse(m models.Message) MessageResponse {
	resp := MessageResponse{
		ID:         m.ID,
		ContractID: m.ContractID,
		Content:    m.Content,
		IsRead:     m.IsRead,
		CreatedAt:  m.CreatedAt,
	}
	if m.Sender.ID != uuid.Nil {
		resp.Sender = ToUserBrief(&m.Sender)
	}
	return resp
}

func ToMessageResponses(messages []models.Message) []MessageResponse {
	responses := make([]MessageResponse, len(messages))
	for i, msg := range messages {
		responses[i] = ToMessageResponse(msg)
	}
	return responses
}
