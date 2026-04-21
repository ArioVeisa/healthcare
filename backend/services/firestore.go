package services

import (
	"context"
	"log"
	"sort"
	"strings"
	"sync"
	"time"

	"agha-backend/config"
	"agha-backend/models"

	storefire "cloud.google.com/go/firestore"
	"github.com/google/uuid"
)

var (
	storeMu   sync.RWMutex
	patientDB = []models.Patient{}
	sessions  = map[string]models.Session{}

	firestoreClient    *storefire.Client
	firestoreEnabled   bool
	patientsCollection = "patients"
	sessionsCollection = "sessions"
)

const firestoreTimeout = 5 * time.Second

// InitializePersistence menyiapkan koneksi Firestore jika env project tersedia.
func InitializePersistence(cfg config.AppConfig) {
	if strings.TrimSpace(cfg.GoogleCloudProject) == "" {
		log.Println("persistence: GOOGLE_CLOUD_PROJECT tidak diset, memakai in-memory store")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := storefire.NewClient(ctx, cfg.GoogleCloudProject)
	if err != nil {
		log.Printf("persistence: gagal inisialisasi Firestore, fallback ke in-memory: %v", err)
		return
	}

	storeMu.Lock()
	firestoreClient = client
	firestoreEnabled = true
	patientsCollection = cfg.PatientsCollection
	sessionsCollection = cfg.SessionsCollection
	storeMu.Unlock()

	log.Printf("persistence: Firestore aktif untuk project %s", cfg.GoogleCloudProject)
}

// ClosePersistence menutup koneksi Firestore bila aktif.
func ClosePersistence() error {
	storeMu.Lock()
	client := firestoreClient
	firestoreClient = nil
	firestoreEnabled = false
	storeMu.Unlock()

	if client == nil {
		return nil
	}

	return client.Close()
}

// PersistResult membawa patient dan session hasil pemrosesan inbound message.
type PersistResult struct {
	Patient models.Patient
	Session models.Session
}

// DashboardMeta merangkum informasi yang sering dibutuhkan frontend.
type DashboardMeta struct {
	TotalPatients       int    `json:"total_patients"`
	RedCount            int    `json:"red_count"`
	YellowCount         int    `json:"yellow_count"`
	GreenCount          int    `json:"green_count"`
	PersistenceMode     string `json:"persistence_mode"`
	SupportsWhatsApp    bool   `json:"supports_whatsapp"`
	SupportsWebSocket   bool   `json:"supports_websocket"`
	SupportsAudioIntake bool   `json:"supports_audio_intake"`
	SupportsImageIntake bool   `json:"supports_image_intake"`
}

// BuildPatientCase membentuk case pasien dari payload inbound yang sudah dinormalisasi.
func BuildPatientCase(inbound NormalizedInbound) PersistResult {
	now := time.Now()
	normalizedPhone := NormalizePhone(inbound.Phone)
	identityBase := firstNonEmpty(normalizedPhone, inbound.Name, inbound.MessageID)
	sessionID := HashIdentity(identityBase)

	storeMu.Lock()

	session, exists := sessions[sessionID]
	if !exists {
		session = models.Session{
			ID:          sessionID,
			PatientHash: sessionID,
			CreatedAt:   now,
		}
	}

	symptoms := stringsTrim(inbound.Symptoms)
	redactedSymptoms := RedactSensitiveText(symptoms)
	maskedName := MaskName(inbound.Name)
	maskedPhone := MaskPhone(normalizedPhone)
	triage, reason, status := AnalyzeTriage(redactedSymptoms, inbound.HasAudio, inbound.HasImage)

	patient := models.Patient{
		ID:            uuid.NewString(),
		SessionID:     sessionID,
		Name:          maskedName,
		Phone:         maskedPhone,
		Symptoms:      redactedSymptoms,
		Triage:        triage,
		AIReason:      reason,
		Status:        status,
		Source:        firstNonEmpty(inbound.Source, "whatsapp"),
		HasAudio:      inbound.HasAudio,
		HasImage:      inbound.HasImage,
		BookingStatus: bookingStatusFor(triage),
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	patientDB = append([]models.Patient{patient}, patientDB...)

	session.MaskedName = maskedName
	session.MaskedPhone = maskedPhone
	session.LastCaseID = patient.ID
	session.MessageCount++
	session.Summary = buildSessionSummary(redactedSymptoms, triage, inbound.HasAudio, inbound.HasImage)
	session.UpdatedAt = now
	if session.CreatedAt.IsZero() {
		session.CreatedAt = now
	}
	session.LastCaseID = patient.ID
	sessions[sessionID] = session
	storeMu.Unlock()

	if err := persistPatientAndSession(patient, session); err != nil {
		log.Printf("persistence: gagal menyimpan patient/session ke Firestore: %v", err)
	}

	log.Printf("triage saved: %s - %s (%s)", patient.Name, patient.Triage, patient.Status)

	return PersistResult{
		Patient: patient,
		Session: session,
	}
}

// SavePatient mempertahankan route lama dan menyimpan pasien yang sudah dibentuk di service lain.
func SavePatient(p models.Patient) {
	storeMu.Lock()
	defer storeMu.Unlock()

	patientDB = append([]models.Patient{p}, patientDB...)
	log.Printf("triage saved: %s - %s", p.Name, p.Triage)
}

// GetAllPatients mengambil semua data (bisa digunakan buat inisialisasi awal UI React)
func GetAllPatients() []models.Patient {
	if result, ok := loadPatientsFromFirestore(); ok {
		return result
	}

	storeMu.RLock()
	defer storeMu.RUnlock()

	result := append([]models.Patient(nil), patientDB...)
	sort.SliceStable(result, func(i, j int) bool {
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})

	return result
}

// GetPatientByID mengambil satu pasien berdasarkan id case.
func GetPatientByID(id string) (models.Patient, bool) {
	patients := GetAllPatients()
	for _, patient := range patients {
		if patient.ID == id {
			return patient, true
		}
	}

	return models.Patient{}, false
}

// GetDashboardMeta menyiapkan summary yang siap pakai untuk frontend.
func GetDashboardMeta() DashboardMeta {
	patients := GetAllPatients()
	meta := DashboardMeta{
		TotalPatients:       len(patients),
		PersistenceMode:     persistenceMode(),
		SupportsWhatsApp:    true,
		SupportsWebSocket:   true,
		SupportsAudioIntake: true,
		SupportsImageIntake: true,
	}

	for _, patient := range patients {
		switch patient.Triage {
		case "MERAH":
			meta.RedCount++
		case "KUNING":
			meta.YellowCount++
		case "HIJAU":
			meta.GreenCount++
		}
	}

	return meta
}

func buildSessionSummary(symptoms, triage string, hasAudio, hasImage bool) string {
	mediaNotes := make([]string, 0, 2)
	if hasAudio {
		mediaNotes = append(mediaNotes, "voice note")
	}
	if hasImage {
		mediaNotes = append(mediaNotes, "gambar")
	}

	if len(mediaNotes) == 0 {
		return symptoms + " | triage " + triage
	}

	return symptoms + " | media: " + stringsJoin(mediaNotes, ", ") + " | triage " + triage
}

func bookingStatusFor(triage string) string {
	switch triage {
	case "MERAH":
		return "immediate-review"
	case "KUNING":
		return "recommended"
	default:
		return "not-required"
	}
}

func stringsTrim(value string) string {
	return strings.TrimSpace(value)
}

func stringsJoin(values []string, sep string) string {
	return strings.Join(values, sep)
}

func persistPatientAndSession(patient models.Patient, session models.Session) error {
	storeMu.RLock()
	client := firestoreClient
	enabled := firestoreEnabled
	patientCollection := patientsCollection
	sessionCollection := sessionsCollection
	storeMu.RUnlock()

	if !enabled || client == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), firestoreTimeout)
	defer cancel()

	if _, err := client.Collection(patientCollection).Doc(patient.ID).Set(ctx, patient); err != nil {
		return err
	}

	_, err := client.Collection(sessionCollection).Doc(session.ID).Set(ctx, session)
	return err
}

func loadPatientsFromFirestore() ([]models.Patient, bool) {
	storeMu.RLock()
	client := firestoreClient
	enabled := firestoreEnabled
	patientCollection := patientsCollection
	storeMu.RUnlock()

	if !enabled || client == nil {
		return nil, false
	}

	ctx, cancel := context.WithTimeout(context.Background(), firestoreTimeout)
	defer cancel()

	docs, err := client.Collection(patientCollection).
		OrderBy("created_at", storefire.Desc).
		Limit(200).
		Documents(ctx).
		GetAll()
	if err != nil {
		log.Printf("persistence: gagal membaca dari Firestore, fallback ke in-memory: %v", err)
		return nil, false
	}

	result := make([]models.Patient, 0, len(docs))
	for _, doc := range docs {
		var patient models.Patient
		if err := doc.DataTo(&patient); err != nil {
			log.Printf("persistence: gagal decode patient doc %s: %v", doc.Ref.ID, err)
			continue
		}
		if patient.ID == "" {
			patient.ID = doc.Ref.ID
		}
		result = append(result, patient)
	}

	return result, true
}

func persistenceMode() string {
	storeMu.RLock()
	defer storeMu.RUnlock()
	if firestoreEnabled && firestoreClient != nil {
		return "firestore"
	}

	return "memory"
}
