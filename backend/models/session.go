package models

import "time"

// Session melacak konteks percakapan pasien lintas pesan masuk.
type Session struct {
	ID           string    `json:"id"`
	PatientHash  string    `json:"patient_hash"`
	MaskedPhone  string    `json:"masked_phone"`
	MaskedName   string    `json:"masked_name"`
	LastCaseID   string    `json:"last_case_id"`
	Summary      string    `json:"summary"`
	MessageCount int       `json:"message_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
