package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"github.com/Tahsin005/workhive-backend/internal/dto"
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/services"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	ws "github.com/Tahsin005/workhive-backend/internal/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type MessageHandler struct {
	service   services.MessageService
	hub       *ws.Hub
	jwtSecret string
}

func NewMessageHandler(service services.MessageService, hub *ws.Hub, jwtSecret string) *MessageHandler {
	return &MessageHandler{service, hub, jwtSecret}
}

func (h *MessageHandler) GetHistory(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	contractID, err := uuid.Parse(c.Param("contractId"))
	if err != nil {
		utils.BadRequest(c, "Invalid contract ID", nil)
		return
	}

	messages, err := h.service.GetHistory(userID, contractID)
	if err != nil {
		switch err.Error() {
		case "contract not found":
			utils.NotFound(c, "Contract not found")
		case "forbidden":
			utils.Forbidden(c, "You are not a participant of this contract")
		default:
			utils.InternalError(c, "Failed to fetch messages")
		}
		return
	}

	utils.OK(c, "Messages fetched successfully", dto.ToMessageResponses(messages))
}

func (h *MessageHandler) SendMessage(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	contractID, err := uuid.Parse(c.Param("contractId"))
	if err != nil {
		utils.BadRequest(c, "Invalid contract ID", nil)
		return
	}

	var input models.SendMessageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	msg, err := h.service.SendMessage(userID, contractID, input.Content)
	if err != nil {
		switch err.Error() {
		case "contract not found":
			utils.NotFound(c, "Contract not found")
		case "forbidden":
			utils.Forbidden(c, "You are not a participant of this contract")
		case "contract is not active":
			utils.BadRequest(c, "Messages can only be sent on active contracts", nil)
		default:
			utils.InternalError(c, "Failed to send message")
		}
		return
	}

	utils.Created(c, "Message sent successfully", dto.ToMessageResponse(*msg))
}

func (h *MessageHandler) MarkAsRead(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	contractID, err := uuid.Parse(c.Param("contractId"))
	if err != nil {
		utils.BadRequest(c, "Invalid contract ID", nil)
		return
	}

	count, err := h.service.MarkAsRead(userID, contractID)
	if err != nil {
		switch err.Error() {
		case "contract not found":
			utils.NotFound(c, "Contract not found")
		case "forbidden":
			utils.Forbidden(c, "You are not a participant of this contract")
		default:
			utils.InternalError(c, "Failed to mark messages as read")
		}
		return
	}

	utils.OK(c, "Messages marked as read", gin.H{"updated": count})
}

// /api/v1/ws/chat/:contractId?token=<jwt>
func (h *MessageHandler) HandleWebSocket(c *gin.Context) {
	// Authenticate via query param token
	token := c.Query("token")
	if token == "" {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	claims, err := utils.ValidateToken(token, h.jwtSecret)
	if err != nil {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	userID := claims.UserID

	contractID, err := uuid.Parse(c.Param("contractId"))
	if err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	// Upgrade before service checks so we can send close frames
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("ws upgrade error: %v", err)
		return
	}

	// Validate contract access — close with policy violation if bad
	_, svcErr := h.service.GetHistory(userID, contractID)
	if svcErr != nil {
		conn.WriteMessage(websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.ClosePolicyViolation, svcErr.Error()))
		conn.Close()
		return
	}

	client := &ws.Client{
		ID:         userID,
		ContractID: contractID,
		Conn:       conn,
		Send:       make(chan []byte, 256),
		Hub:        h.hub,
	}
	h.hub.Register <- client

	// sendFunc: save to DB then broadcast to room
	sendFunc := func(content string) error {
		msg, err := h.service.SendMessage(userID, contractID, content)
		if err != nil {
			return err
		}
		payload, err := json.Marshal(dto.ToMessageResponse(*msg))
		if err != nil {
			log.Printf("ws marshal error: %v", err)
			return nil // don't crash the hub on a JSON error
		}
		h.hub.Broadcast <- &ws.BroadcastMessage{
			ContractID: contractID,
			Payload:    payload,
		}
		return nil
	}

	go client.WritePump()
	go client.ReadPump(sendFunc)
}
