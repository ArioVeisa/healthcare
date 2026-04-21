package services

import (
	"context"
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"agha-backend/config"
	"agha-backend/models"

	storefire "cloud.google.com/go/firestore"
	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

var (
	storeMu   sync.RWMutex
	patientDB = []models.Patient{}
	sessions  = map[string]models.Session{}

	sqliteDB           *sql.DB
	sqliteEnabled      bool
	sqlitePath         = "data/agha.db"
	firestoreClient    *storefire.Client
	firestoreEnabled   bool
	patientsCollection = "patients"
	sessionsCollection = "sessions"
)

const firestoreTimeout = 5 * time.Second

// InitializePersistence menyiapkan koneksi Firestore jika env project tersedia.
func InitializePersistence(cfg config.AppConfig) {
	driver := strings.ToLower(strings.TrimSpace(cfg.PersistenceDriver))
	if driver == "" {
		driver = "sqlite"
	}

	if driver == "sqlite" {
		if err := initializeSQLite(cfg.SQLitePath); err != nil {
			log.Printf("persistence: gagal inisialisasi SQLite, fallback ke in-memory: %v", err)
			return
		}

		log.Printf("persistence: SQLite aktif di %s", cfg.SQLitePath)
		return
	}

	if driver != "firestore" {
		log.Printf("persistence: driver %s tidak dikenali, fallback ke in-memory", driver)
		return
	}

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
	sqlDB := sqliteDB
	sqliteDB = nil
	sqliteEnabled = false
	client := firestoreClient
	firestoreClient = nil
	firestoreEnabled = false
	storeMu.Unlock()

	if sqlDB != nil {
		if err := sqlDB.Close(); err != nil {
			return err
		}
	}

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
	if result, ok := loadPatientsFromSQLite(); ok {
		return result
	}

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
	if err := persistPatientAndSessionToSQLite(patient, session); err != nil {
		return err
	}

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

func persistPatientAndSessionToSQLite(patient models.Patient, session models.Session) error {
	storeMu.RLock()
	db := sqliteDB
	enabled := sqliteEnabled
	storeMu.RUnlock()

	if !enabled || db == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), firestoreTimeout)
	defer cancel()

	_, err := db.ExecContext(ctx, `
		INSERT INTO patients (
			id, session_id, name, phone, symptoms, triage, ai_reason, status,
			source, has_audio, has_image, booking_status, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			session_id=excluded.session_id,
			name=excluded.name,
			phone=excluded.phone,
			symptoms=excluded.symptoms,
			triage=excluded.triage,
			ai_reason=excluded.ai_reason,
			status=excluded.status,
			source=excluded.source,
			has_audio=excluded.has_audio,
			has_image=excluded.has_image,
			booking_status=excluded.booking_status,
			created_at=excluded.created_at,
			updated_at=excluded.updated_at
	`,
		patient.ID,
		patient.SessionID,
		patient.Name,
		patient.Phone,
		patient.Symptoms,
		patient.Triage,
		patient.AIReason,
		patient.Status,
		patient.Source,
		boolToInt(patient.HasAudio),
		boolToInt(patient.HasImage),
		patient.BookingStatus,
		patient.CreatedAt.Format(time.RFC3339Nano),
		patient.UpdatedAt.Format(time.RFC3339Nano),
	)
	if err != nil {
		return err
	}

	_, err = db.ExecContext(ctx, `
		INSERT INTO sessions (
			id, patient_hash, masked_phone, masked_name, last_case_id, summary,
			message_count, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			patient_hash=excluded.patient_hash,
			masked_phone=excluded.masked_phone,
			masked_name=excluded.masked_name,
			last_case_id=excluded.last_case_id,
			summary=excluded.summary,
			message_count=excluded.message_count,
			created_at=excluded.created_at,
			updated_at=excluded.updated_at
	`,
		session.ID,
		session.PatientHash,
		session.MaskedPhone,
		session.MaskedName,
		session.LastCaseID,
		session.Summary,
		session.MessageCount,
		session.CreatedAt.Format(time.RFC3339Nano),
		session.UpdatedAt.Format(time.RFC3339Nano),
	)

	return err
}

func loadPatientsFromSQLite() ([]models.Patient, bool) {
	storeMu.RLock()
	db := sqliteDB
	enabled := sqliteEnabled
	storeMu.RUnlock()

	if !enabled || db == nil {
		return nil, false
	}

	ctx, cancel := context.WithTimeout(context.Background(), firestoreTimeout)
	defer cancel()

	rows, err := db.QueryContext(ctx, `
		SELECT id, session_id, name, phone, symptoms, triage, ai_reason, status,
		       source, has_audio, has_image, booking_status, created_at, updated_at
		FROM patients
		ORDER BY datetime(created_at) DESC
		LIMIT 200
	`)
	if err != nil {
		log.Printf("persistence: gagal membaca dari SQLite, fallback ke in-memory: %v", err)
		return nil, false
	}
	defer rows.Close()

	result := make([]models.Patient, 0)
	for rows.Next() {
		var patient models.Patient
		var createdAt string
		var updatedAt string
		var hasAudio int
		var hasImage int

		if err := rows.Scan(
			&patient.ID,
			&patient.SessionID,
			&patient.Name,
			&patient.Phone,
			&patient.Symptoms,
			&patient.Triage,
			&patient.AIReason,
			&patient.Status,
			&patient.Source,
			&hasAudio,
			&hasImage,
			&patient.BookingStatus,
			&createdAt,
			&updatedAt,
		); err != nil {
			log.Printf("persistence: gagal scan row SQLite: %v", err)
			continue
		}

		patient.HasAudio = hasAudio == 1
		patient.HasImage = hasImage == 1
		patient.CreatedAt = parseTime(createdAt)
		patient.UpdatedAt = parseTime(updatedAt)
		result = append(result, patient)
	}

	if err := rows.Err(); err != nil {
		log.Printf("persistence: iterasi rows SQLite gagal: %v", err)
		return nil, false
	}

	return result, true
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
	if sqliteEnabled && sqliteDB != nil {
		return "sqlite"
	}
	if firestoreEnabled && firestoreClient != nil {
		return "firestore"
	}

	return "memory"
}

func initializeSQLite(path string) error {
	trimmedPath := strings.TrimSpace(path)
	if trimmedPath == "" {
		trimmedPath = "data/agha.db"
	}

	if err := os.MkdirAll(filepath.Dir(trimmedPath), 0o755); err != nil {
		return err
	}

	db, err := sql.Open("sqlite", trimmedPath)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	stmts := []string{
		`CREATE TABLE IF NOT EXISTS patients (
			id TEXT PRIMARY KEY,
			session_id TEXT,
			name TEXT,
			phone TEXT,
			symptoms TEXT,
			triage TEXT,
			ai_reason TEXT,
			status TEXT,
			source TEXT,
			has_audio INTEGER,
			has_image INTEGER,
			booking_status TEXT,
			created_at TEXT,
			updated_at TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			patient_hash TEXT,
			masked_phone TEXT,
			masked_name TEXT,
			last_case_id TEXT,
			summary TEXT,
			message_count INTEGER,
			created_at TEXT,
			updated_at TEXT
		)`,
	}

	for _, stmt := range stmts {
		if _, err := db.ExecContext(ctx, stmt); err != nil {
			db.Close()
			return err
		}
	}

	storeMu.Lock()
	sqliteDB = db
	sqliteEnabled = true
	sqlitePath = trimmedPath
	storeMu.Unlock()

	return nil
}

func boolToInt(value bool) int {
	if value {
		return 1
	}

	return 0
}

func parseTime(value string) time.Time {
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err == nil {
		return parsed
	}

	return time.Time{}
}
