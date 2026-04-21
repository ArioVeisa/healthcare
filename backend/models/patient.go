package models

import "time"

// Patient merepresentasikan data pasien triage
type Patient struct {
	ID            string    `json:"id" firestore:"id"`
	SessionID     string    `json:"session_id,omitempty" firestore:"session_id,omitempty"`
	Name          string    `json:"name" firestore:"name"`
	Phone         string    `json:"phone" firestore:"phone"`
	Symptoms      string    `json:"symptoms" firestore:"symptoms"`
	Triage        string    `json:"triage" firestore:"triage"`
	AIReason      string    `json:"ai_reason" firestore:"ai_reason"`
	Status        string    `json:"status,omitempty" firestore:"status,omitempty"`
	Source        string    `json:"source,omitempty" firestore:"source,omitempty"`
	HasAudio      bool      `json:"has_audio,omitempty" firestore:"has_audio,omitempty"`
	HasImage      bool      `json:"has_image,omitempty" firestore:"has_image,omitempty"`
	BookingStatus string    `json:"booking_status,omitempty" firestore:"booking_status,omitempty"`
	CreatedAt     time.Time `json:"created_at" firestore:"created_at"`
	UpdatedAt     time.Time `json:"updated_at,omitempty" firestore:"updated_at,omitempty"`
}
