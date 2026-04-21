package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

// NormalizedInbound adalah representasi internal tunggal untuk pesan masuk.
type NormalizedInbound struct {
	MessageID   string
	Name        string
	Phone       string
	Symptoms    string
	Source      string
	MessageType string
	HasAudio    bool
	HasImage    bool
}

type legacyWebhookRequest struct {
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Symptoms string `json:"symptoms"`
}

type whatsAppPayload struct {
	Object string `json:"object"`
	Entry  []struct {
		Changes []struct {
			Value struct {
				Contacts []struct {
					Profile struct {
						Name string `json:"name"`
					} `json:"profile"`
					WaID string `json:"wa_id"`
				} `json:"contacts"`
				Messages []struct {
					From      string `json:"from"`
					ID        string `json:"id"`
					Timestamp string `json:"timestamp"`
					Type      string `json:"type"`
					Text      struct {
						Body string `json:"body"`
					} `json:"text"`
					Image struct {
						ID      string `json:"id"`
						Caption string `json:"caption"`
					} `json:"image"`
					Audio struct {
						ID string `json:"id"`
					} `json:"audio"`
					Button struct {
						Text string `json:"text"`
					} `json:"button"`
					Interactive struct {
						ButtonReply struct {
							Title string `json:"title"`
						} `json:"button_reply"`
					} `json:"interactive"`
				} `json:"messages"`
			} `json:"value"`
		} `json:"changes"`
	} `json:"entry"`
}

// ParseIncomingRequests mendukung payload legacy dan payload webhook WhatsApp resmi.
func ParseIncomingRequests(body []byte) ([]NormalizedInbound, error) {
	body = bytesTrimSpace(body)
	if len(body) == 0 {
		return nil, errors.New("request body is empty")
	}

	legacy := legacyWebhookRequest{}
	if err := json.Unmarshal(body, &legacy); err == nil {
		if strings.TrimSpace(legacy.Phone) != "" || strings.TrimSpace(legacy.Symptoms) != "" || strings.TrimSpace(legacy.Name) != "" {
			return []NormalizedInbound{{
				Name:        defaultName(legacy.Name),
				Phone:       legacy.Phone,
				Symptoms:    strings.TrimSpace(legacy.Symptoms),
				Source:      "legacy-webhook",
				MessageType: "text",
			}}, nil
		}
	}

	payload := whatsAppPayload{}
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, fmt.Errorf("unable to parse inbound payload: %w", err)
	}

	result := make([]NormalizedInbound, 0)
	for _, entry := range payload.Entry {
		for _, change := range entry.Changes {
			contactName := "Pasien WhatsApp"
			contactPhone := ""
			if len(change.Value.Contacts) > 0 {
				contact := change.Value.Contacts[0]
				contactName = defaultName(contact.Profile.Name)
				contactPhone = contact.WaID
			}

			for _, message := range change.Value.Messages {
				normalized := NormalizedInbound{
					MessageID:   message.ID,
					Name:        contactName,
					Phone:       firstNonEmpty(message.From, contactPhone),
					Source:      "whatsapp",
					MessageType: message.Type,
				}

				switch message.Type {
				case "text":
					normalized.Symptoms = strings.TrimSpace(message.Text.Body)
				case "image":
					normalized.HasImage = true
					normalized.Symptoms = strings.TrimSpace(message.Image.Caption)
					if normalized.Symptoms == "" {
						normalized.Symptoms = "Pasien mengirim gambar kondisi fisik dan perlu peninjauan lebih lanjut."
					}
				case "audio":
					normalized.HasAudio = true
					normalized.Symptoms = "Pasien mengirim voice note. Perlu transkripsi atau klarifikasi lanjutan dari operator medis."
				case "button":
					normalized.Symptoms = strings.TrimSpace(message.Button.Text)
				case "interactive":
					normalized.Symptoms = strings.TrimSpace(message.Interactive.ButtonReply.Title)
				default:
					normalized.Symptoms = fmt.Sprintf("Pesan tipe %s diterima dan perlu ditinjau operator.", message.Type)
				}

				normalized.Symptoms = strings.TrimSpace(normalized.Symptoms)
				if normalized.Symptoms == "" {
					normalized.Symptoms = "Pasien mengirim pesan tanpa detail keluhan. Perlu klarifikasi lanjutan."
				}

				result = append(result, normalized)
			}
		}
	}

	if len(result) == 0 {
		return nil, errors.New("no inbound messages found in payload")
	}

	return result, nil
}

func bytesTrimSpace(body []byte) []byte {
	return []byte(strings.TrimSpace(string(body)))
}

func defaultName(name string) string {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return "Pasien Anonim"
	}

	return trimmed
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}

	return ""
}
