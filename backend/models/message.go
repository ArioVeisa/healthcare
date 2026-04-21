package models

import "time"

// Message menyimpan representasi pesan yang diterima backend sebelum atau sesudah diproses.
type Message struct {
	ID         string    `json:"id" firestore:"id"`
	SessionID  string    `json:"session_id" firestore:"session_id"`
	PatientID  string    `json:"patient_id" firestore:"patient_id"`
	Source     string    `json:"source" firestore:"source"`
	Type       string    `json:"type" firestore:"type"`
	Text       string    `json:"text" firestore:"text"`
	HasAudio   bool      `json:"has_audio,omitempty" firestore:"has_audio,omitempty"`
	HasImage   bool      `json:"has_image,omitempty" firestore:"has_image,omitempty"`
	ReceivedAt time.Time `json:"received_at" firestore:"received_at"`
}
