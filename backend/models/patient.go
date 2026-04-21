package models

import "time"

// Patient merepresentasikan data pasien triage
type Patient struct {
    ID        string    `json:"id" firestore:"-"`
    Name      string    `json:"name" firestore:"name"`       // Akan dianonymize dari middleware/vertex
    Phone     string    `json:"phone" firestore:"phone"`     // Anonymized: +62812***
    Symptoms  string    `json:"symptoms" firestore:"symptoms"`
    Triage    string    `json:"triage" firestore:"triage"`   // MERAH, KUNING, HIJAU
    AIReason  string    `json:"ai_reason" firestore:"ai_reason"`
    CreatedAt time.Time `json:"created_at" firestore:"created_at"`
}
