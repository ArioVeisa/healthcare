package handlers

import (
	"log"
	"sync"

	"github.com/gofiber/contrib/websocket"
)

var (
	// Daftar client yang konek ke WS
	clients   = make(map[*websocket.Conn]bool)
	clientsMu sync.RWMutex
)

// WSHandler mengelola koneksi realtime dashboard React
func WSHandler(c *websocket.Conn) {
	registerClient(c)

	defer func() {
		unregisterClient(c)
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
	clientsMu.RLock()
	snapshot := make([]*websocket.Conn, 0, len(clients))
	for client := range clients {
		snapshot = append(snapshot, client)
	}
	clientsMu.RUnlock()

	for _, client := range snapshot {
		if err := client.WriteJSON(data); err != nil {
			client.Close()
			unregisterClient(client)
		}
	}
}

func registerClient(conn *websocket.Conn) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	clients[conn] = true
}

func unregisterClient(conn *websocket.Conn) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	delete(clients, conn)
}
