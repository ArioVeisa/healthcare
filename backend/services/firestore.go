package services

import (
	"log"

	"agha-backend/models"
)

// In-memory array mem-mock Firestore untuk percobaan tanpa Setup Credentials GCP
var PatientDB = []models.Patient{}

// SavePatient menyimpan list pasien secara mock
func SavePatient(p models.Patient) {
	// CATATAN LOMBA: Jika file JSON Service account sudah ada, implementasi `client.Collection("patients").Doc(p.ID).Set(ctx, p)`
	PatientDB = append([]models.Patient{p}, PatientDB...) // Prepend for sorting latest
	log.Printf("Triage Saved: %s - %s", p.Name, p.Triage)
}

// GetAllPatients mengambil semua data (bisa digunakan buat inisialisasi awal UI React)
func GetAllPatients() []models.Patient {
	return PatientDB
}
