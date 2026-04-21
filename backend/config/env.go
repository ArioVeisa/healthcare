package config

import (
	"os"
	"strings"
	"sync"
)

// AppConfig menyimpan konfigurasi runtime backend.
type AppConfig struct {
	Port                string
	AllowedOrigins      []string
	WhatsAppVerifyToken string
	WhatsAppAppSecret   string
	AppName             string
	GoogleCloudProject  string
	PatientsCollection  string
	SessionsCollection  string
}

var (
	loadOnce sync.Once
	loaded   AppConfig
)

// Load membaca environment variables sekali lalu menyimpannya di memory.
func Load() AppConfig {
	loadOnce.Do(func() {
		loaded = AppConfig{
			Port:                getEnv("PORT", "8080"),
			AllowedOrigins:      splitCSV(getEnv("ALLOWED_ORIGINS", "*")),
			WhatsAppVerifyToken: getEnv("WHATSAPP_VERIFY_TOKEN", "agha-dev-verify-token"),
			WhatsAppAppSecret:   getEnv("WHATSAPP_APP_SECRET", ""),
			AppName:             getEnv("APP_NAME", "AGHA Triage Backend"),
			GoogleCloudProject:  getEnv("GOOGLE_CLOUD_PROJECT", ""),
			PatientsCollection:  getEnv("FIRESTORE_PATIENTS_COLLECTION", "patients"),
			SessionsCollection:  getEnv("FIRESTORE_SESSIONS_COLLECTION", "sessions"),
		}
	})

	return loaded
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		value = strings.TrimSpace(value)
		if value != "" {
			return value
		}
	}

	return fallback
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))

	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}

	if len(result) == 0 {
		return []string{"*"}
	}

	return result
}
