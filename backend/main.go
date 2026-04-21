package main

import (
	"log"

	"agha-backend/handlers"
	"agha-backend/middleware"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	app := fiber.New()

	// CORS Setup
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))
	app.Use(logger.New())

	// API Routes
	api := app.Group("/api")

	// PII Anonymizer Middleware (Hanya dipakai pada WhatsApp Webhook endpoint)
	api.Post("/webhook", middleware.AnonymizePII(), handlers.WhatsAppWebhookHandler)
	api.Get("/patients", handlers.GetAllPatientsHandler)

	// Update Websocket Route
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws/patients", websocket.New(handlers.WSHandler))

	log.Println("Server backend AGHA Triage berlari di port :8080 🚀")
	log.Fatal(app.Listen(":8080"))
}
