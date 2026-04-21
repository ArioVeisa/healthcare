package handlers

import (
	"agha-backend/config"
	"agha-backend/services"

	"github.com/gofiber/fiber/v2"
)

// HealthHandler menyediakan endpoint sederhana untuk health checks.
func HealthHandler(c *fiber.Ctx) error {
	cfg := config.Load()
	meta := services.GetDashboardMeta()

	return c.JSON(fiber.Map{
		"status":             "ok",
		"app_name":           cfg.AppName,
		"persistence_mode":   meta.PersistenceMode,
		"supports_whatsapp":  meta.SupportsWhatsApp,
		"supports_websocket": meta.SupportsWebSocket,
	})
}
