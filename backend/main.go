package main

import (
	"fmt"
	"log"
	"strings"

	"agha-backend/config"
	"agha-backend/handlers"
	"agha-backend/services"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	cfg := config.Load()
	services.InitializePersistence(cfg)
	defer func() {
		if err := services.ClosePersistence(); err != nil {
			log.Printf("error closing persistence: %v", err)
		}
	}()

	app := fiber.New()

	// CORS Setup
	app.Use(cors.New(cors.Config{
		AllowOrigins: strings.Join(cfg.AllowedOrigins, ","),
		AllowHeaders: "Origin, Content-Type, Accept",
	}))
	app.Use(logger.New())
	app.Get("/healthz", handlers.HealthHandler)

	// API Routes
	api := app.Group("/api")

	// Backward-compatible route untuk payload demo/legacy yang dipakai frontend saat ini.
	api.Post("/webhook", handlers.WhatsAppWebhookHandler)
	api.Get("/patients", handlers.GetAllPatientsHandler)
	api.Get("/patients/:id", handlers.GetPatientByIDHandler)
	api.Get("/meta", handlers.DashboardMetaHandler)
	app.Get("/webhooks/whatsapp", handlers.WhatsAppVerificationHandler)
	app.Post("/webhooks/whatsapp", handlers.WhatsAppInboundHandler)

	// Update Websocket Route
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws/patients", websocket.New(handlers.WSHandler))

	address := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("%s berjalan di port %s", cfg.AppName, address)
	log.Fatal(app.Listen(address))
}
