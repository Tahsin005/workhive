package websocket

import (
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/google/uuid"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 70 * time.Second
	pingPeriod     = 60 * time.Second
	maxMessageSize = 4096
)

// Client represents one WebSocket connection.
type Client struct {
	ID         uuid.UUID
	ContractID uuid.UUID
	Conn       *websocket.Conn
	Send       chan []byte
	Hub        *Hub
}

// BroadcastMessage carries a payload destined for all clients in a contract room.
type BroadcastMessage struct {
	ContractID uuid.UUID
	Payload    []byte
}

// Hub manages all active connections grouped by contractID.
type Hub struct {
	Rooms      map[uuid.UUID]map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan *BroadcastMessage
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Rooms:      make(map[uuid.UUID]map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *BroadcastMessage, 256),
	}
}

// Run must be started as a goroutine in main.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			if h.Rooms[client.ContractID] == nil {
				h.Rooms[client.ContractID] = make(map[*Client]bool)
			}
			h.Rooms[client.ContractID][client] = true
			h.mu.Unlock()

		case client := <-h.Unregister:
			h.mu.Lock()
			if room, ok := h.Rooms[client.ContractID]; ok {
				if _, exists := room[client]; exists {
					delete(room, client)
					close(client.Send)
					if len(room) == 0 {
						delete(h.Rooms, client.ContractID)
					}
				}
			}
			h.mu.Unlock()

		case msg := <-h.Broadcast:
			h.mu.RLock()
			room := h.Rooms[msg.ContractID]
			h.mu.RUnlock()
			for client := range room {
				select {
				case client.Send <- msg.Payload:
				default:
					// Slow client — close and unregister
					h.Unregister <- client
				}
			}
		}
	}
}

// ReadPump pumps messages from WebSocket → validates → saves to DB → broadcasts.
// The caller passes a sendFunc that handles save + broadcast to decouple hub from DB.
func (c *Client) ReadPump(sendFunc func(content string) error) {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, rawMsg, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws read error: %v", err)
			}
			break
		}

		content := string(rawMsg)
		if len(content) == 0 || len(content) > 2000 {
			continue // silently skip invalid messages
		}

		if err := sendFunc(content); err != nil {
			log.Printf("ws sendFunc error: %v", err)
		}
	}
}

// WritePump pumps messages from the Send channel → WebSocket connection.
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
