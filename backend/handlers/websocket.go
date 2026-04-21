package handlers

import (
	"log"
	"sync"

	"github.com/gofiber/contrib/websocket"
)

var (
	// Daftar client yang konek ke WS
	clients   = make(map[*websocket.Conn]bool)
	clientsMu sync.Mutex
)

// WSHandler mengelola koneksi realtime dashboard React
func WSHandler(c *websocket.Conn) {
	clientsMu.Lock()
	clients[c] = true
	clientsMu.Unlock()

	defer func() {
		clientsMu.Lock()
		delete(clients, c)
		clientsMu.Unlock()
		c.Close()
	}()

	for {
		// Tunggu ping dari frontend
		_, _, err := c.ReadMessage()
		if err != nil {
			log.Println("Client WS disconnected:", err)
			break
		}
	}
}

// BroadcastToClients mengirimkan data pasien terbaru ke semua dashboard React yang terbuka
func BroadcastToClients(data interface{}) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	for client := range clients {
		if err := client.WriteJSON(data); err != nil {
			client.Close()
			delete(clients, client)
		}
	}
}
