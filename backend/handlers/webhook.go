package handlers

import (
	"time"

	"agha-backend/models"
	"agha-backend/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// WebhookRequest mencerminkan Payload dari WhatsApp API JSON
type WebhookRequest struct {
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Symptoms string `json:"symptoms"`
}

// WhatsAppWebhookHandler memproses webhook masuk
func WhatsAppWebhookHandler(c *fiber.Ctx) error {
	var req WebhookRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid format JSON"})
	}

	// 1. Eksekusi Vertex AI Gemini
	triageColor, aiReason := services.AnalyzeTriage(req.Symptoms)

	// 2. Format Patient (Name dan Phone aslinya sudah di masking di Middleware Anonymizer)
	patient := models.Patient{
		ID:        uuid.New().String(),
		Name:      req.Name,
		Phone:     req.Phone,
		Symptoms:  req.Symptoms,
		Triage:    triageColor,
		AIReason:  aiReason,
		CreatedAt: time.Now(),
	}

	// 3. Simpan ke Firestore (Async Mock)
	services.SavePatient(patient)

	// 4. Update Frontend React Dashboard via Stream WebSocket (goroutine)
	go BroadcastToClients(patient)

	return c.JSON(fiber.Map{
		"message":   "Analisis Triage Berhasil",
		"triage":    patient.Triage,
		"patientId": patient.ID,
	})
}

// GetAllPatientsHandler mengembalikan data awal list pasien di database
func GetAllPatientsHandler(c *fiber.Ctx) error {
	return c.JSON(services.GetAllPatients())
}
