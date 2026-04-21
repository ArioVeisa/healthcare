package handlers

import (
	"agha-backend/config"
	"agha-backend/services"

	"github.com/gofiber/fiber/v2"
)

// WhatsAppWebhookHandler memproses webhook masuk
func WhatsAppWebhookHandler(c *fiber.Ctx) error {
	inboundMessages, err := services.ParseIncomingRequests(c.Body())
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	results := make([]services.PersistResult, 0, len(inboundMessages))
	for _, inbound := range inboundMessages {
		result := services.BuildPatientCase(inbound)
		results = append(results, result)
		go BroadcastToClients(result.Patient)
	}

	if len(results) == 1 {
		patient := results[0].Patient
		return c.JSON(fiber.Map{
			"message":   "Analisis Triage Berhasil",
			"triage":    patient.Triage,
			"status":    patient.Status,
			"patientId": patient.ID,
			"patient":   patient,
		})
	}

	patients := make([]interface{}, 0, len(results))
	for _, result := range results {
		patients = append(patients, result.Patient)
	}

	return c.JSON(fiber.Map{
		"message":  "Batch inbound berhasil diproses",
		"count":    len(results),
		"patients": patients,
	})
}

// GetAllPatientsHandler mengembalikan data awal list pasien di database
func GetAllPatientsHandler(c *fiber.Ctx) error {
	return c.JSON(services.GetAllPatients())
}

// GetPatientByIDHandler mengembalikan satu patient case lengkap untuk detail view frontend.
func GetPatientByIDHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	patient, ok := services.GetPatientByID(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "patient not found"})
	}

	return c.JSON(patient)
}

// DashboardMetaHandler mengembalikan summary dan capability backend untuk frontend.
func DashboardMetaHandler(c *fiber.Ctx) error {
	return c.JSON(services.GetDashboardMeta())
}

// WhatsAppVerificationHandler menangani challenge awal dari Meta webhook configuration.
func WhatsAppVerificationHandler(c *fiber.Ctx) error {
	cfg := config.Load()
	mode := c.Query("hub.mode")
	token := c.Query("hub.verify_token")
	challenge := c.Query("hub.challenge")

	if mode != "subscribe" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid hub.mode"})
	}

	if token != cfg.WhatsAppVerifyToken {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid verify token"})
	}

	if challenge == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing hub.challenge"})
	}

	return c.SendString(challenge)
}

// WhatsAppInboundHandler menerima payload resmi WhatsApp dan memprosesnya lewat pipeline yang sama.
func WhatsAppInboundHandler(c *fiber.Ctx) error {
	if err := services.VerifyWhatsAppSignature(c.Body(), c.Get("X-Hub-Signature-256"), config.Load().WhatsAppAppSecret); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return WhatsAppWebhookHandler(c)
}
