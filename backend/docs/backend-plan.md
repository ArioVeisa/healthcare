# Backend Plan

## Tujuan

Dokumen ini adalah plan implementasi backend AGHA/NEURA yang lengkap dan bisa langsung dipakai untuk eksekusi tim.

Target akhir backend:

- menerima inbound event asli dari WhatsApp Business API
- memproses text, audio, dan image
- melakukan triage dengan Vertex AI
- menyimpan session dan case pasien di Firestore
- mengirim update real-time ke dashboard frontend
- mengeksekusi action seperti scheduling bila diperlukan
- menjaga privasi, logging, dan audit dasar untuk demo hackathon

Dokumen ini sengaja fokus pada backend yang realistis untuk hackathon, bukan desain enterprise penuh.

## Ringkasan Kondisi Saat Ini

Yang sudah ada di repo:

- server Go dengan Fiber
- endpoint `POST /api/webhook` untuk payload mock
- endpoint `GET /api/patients`
- websocket `GET /ws/patients`
- middleware masking PII sederhana
- model `Patient` untuk kebutuhan dashboard

Yang masih mock atau belum ada:

- webhook verification Meta
- parser event WhatsApp asli
- media download dari `media_id`
- Firestore sungguhan
- session/case state management
- Vertex AI sungguhan
- outbound WhatsApp reply
- Google Calendar scheduling
- audit trail dan security hardening

## Prinsip Implementasi

Prinsip backend yang harus dijaga selama implementasi:

1. Jangan rusak kontrak data minimal yang sudah dipakai frontend.
2. Ganti mock bertahap, jangan rewrite total tanpa kebutuhan kuat.
3. Source of truth akhir harus di Firestore, bukan di memory.
4. Data sensitif harus dibatasi sejak awal, jangan tunggu belakangan.
5. Real-time dashboard tetap dipertahankan walau storage berpindah.
6. Fokus dulu ke flow demo yang hidup, baru optimasi belakangan.

## Target Scope Backend

### In scope

- inbound webhook WhatsApp
- message normalization
- text triage
- audio/image preparation
- persistence nyata via SQLite atau Firestore
- websocket bridge ke frontend
- status case
- basic audit logging
- scheduling tool dasar

### Nice to have

- retry mechanism yang lebih rapi
- confidence score dari AI
- doctor acknowledgment flow
- escalation khusus IGD
- field encryption granular

### Out of scope untuk MVP

- auth dashboard yang kompleks
- role matrix enterprise
- full observability stack enterprise
- queue terpisah untuk setiap background job
- multi-tenant hospital architecture

## Gap Backend Lengkap

### 1. Ingress belum real

Masalah sekarang:

- endpoint saat ini hanya menerima JSON mock `name`, `phone`, `symptoms`
- belum ada verifikasi webhook Meta
- belum ada signature verification
- belum ada parsing message type resmi WhatsApp

Yang harus ditambah:

- `GET /webhooks/whatsapp` untuk verification challenge
- `POST /webhooks/whatsapp` untuk inbound events
- parser text, image, audio, dan metadata sender
- request validation dan safe logging

### 2. AI masih dummy

Masalah sekarang:

- triage masih random
- tidak ada prompt medis
- tidak ada structured output
- tidak ada fallback atau timeout policy

Yang harus ditambah:

- service Vertex AI
- prompt triage khusus
- output JSON terstruktur
- fallback saat model gagal

### 3. Persistence belum ada

Masalah sekarang:

- data hilang saat restart
- tidak ada session pasien
- tidak ada hubungan antar pesan dalam satu kasus
- tidak ada status flow per case

Yang harus ditambah:

- Firestore collections untuk session, case, message, audit
- model case dan session
- updated timestamp dan state transitions

### 4. Multimodal belum ada

Masalah sekarang:

- tidak ada download audio/image
- tidak ada image sanitization
- tidak ada transcript pipeline
- tidak ada multimodal context builder

Yang harus ditambah:

- media downloader
- buffer-only processing
- EXIF stripping
- text + audio + image aggregator

### 5. Action layer belum ada

Masalah sekarang:

- belum bisa kirim balasan otomatis
- belum bisa booking jadwal
- belum bisa cek availability

Yang harus ditambah:

- outbound WhatsApp sender
- calendar integration
- function execution layer

### 6. Security dan audit belum cukup

Masalah sekarang:

- CORS terlalu longgar
- tidak ada auth/signature validation
- masking masih regex raw body
- tidak ada audit event terstruktur

Yang harus ditambah:

- secret management
- redact per field
- webhook signature verification
- structured logs dan audit event

## Arsitektur Backend Yang Disarankan

Tetap gunakan Go agar selaras dengan skeleton repo sekarang.

### Komponen utama

1. `Ingress Layer`
2. `Message Normalizer`
3. `Media Handler`
4. `PII Redaction Layer`
5. `Session Store`
6. `Vertex AI Orchestrator`
7. `Action Layer`
8. `Realtime Dashboard Bridge`
9. `Audit Logging`

### Alur singkat komponen

1. WhatsApp kirim event ke webhook.
2. Handler parse event menjadi model internal.
3. Session diambil atau dibuat.
4. Media diunduh ke memory bila diperlukan.
5. Text/transcript di-redact.
6. Context dibentuk dan dikirim ke Vertex AI.
7. Hasil triage disimpan ke Firestore.
8. Event didorong ke websocket dashboard.
9. Bila perlu, tool scheduling dijalankan.
10. Response dan audit event disimpan.

## Flow Backend Detail

### Flow utama

1. Pasien mengirim WhatsApp text, voice note, atau image.
2. Meta mengirim webhook ke backend.
3. Backend memverifikasi request.
4. Backend ekstrak sender, message id, timestamp, type, dan media id.
5. Backend cek session berdasarkan nomor WhatsApp yang sudah dinormalisasi atau di-hash.
6. Backend simpan inbound message mentah yang sudah dibatasi atau versi normalized.
7. Jika ada media, backend mengambil media URL lalu download ke buffer.
8. Backend menghapus metadata sensitif dan melakukan redaksi PII pada data text.
9. Backend membangun context dari session summary + current input.
10. Backend mengirim request ke Vertex AI.
11. Backend menerima hasil triage terstruktur.
12. Backend membuat atau mengupdate case.
13. Backend menyimpan hasil ke Firestore.
14. Backend mengirim event realtime ke dashboard.
15. Backend mengirim balasan ke pasien jika perlu.
16. Backend menulis audit log.

### Flow status case

Status yang direkomendasikan:

- `received`
- `media_fetching`
- `redacted`
- `analyzing`
- `awaiting_clarification`
- `triaged`
- `scheduled`
- `escalated`
- `closed`
- `failed`

### Flow untuk triage merah

1. AI mengembalikan `triage = MERAH`.
2. Backend simpan `status = escalated` atau `triaged` dengan severity tinggi.
3. Backend broadcast event urgent ke frontend.
4. Backend kirim balasan WhatsApp berisi instruksi darurat.
5. Jika scope demo mendukung, backend trigger scheduling atau handoff.

### Flow untuk butuh klarifikasi

1. AI menilai data belum cukup.
2. Backend set `status = awaiting_clarification`.
3. Backend kirim pertanyaan follow-up ke pasien.
4. Pesan lanjutan pasien dihubungkan ke session/case yang sama.

## Data Model Yang Disarankan

### Collection Firestore

- `sessions`
- `cases`
- `messages`
- `appointments`
- `audit_events`

### `sessions`

Field minimum:

- `session_id`
- `patient_hash`
- `masked_phone`
- `last_case_id`
- `summary`
- `last_activity_at`
- `created_at`
- `updated_at`

### `cases`

Field minimum:

- `id`
- `session_id`
- `name`
- `phone`
- `symptoms`
- `triage`
- `ai_reason`
- `status`
- `source`
- `has_audio`
- `has_image`
- `booking_status`
- `created_at`
- `updated_at`

### `messages`

Field minimum:

- `id`
- `session_id`
- `case_id`
- `sender`
- `type`
- `text`
- `media_id`
- `media_mime_type`
- `created_at`

### `audit_events`

Field minimum:

- `id`
- `case_id`
- `session_id`
- `event_type`
- `status`
- `summary`
- `created_at`

## Kontrak Data Ke Frontend

Karena frontend sudah berjalan, field berikut jangan dihapus:

- `id`
- `name`
- `phone`
- `symptoms`
- `triage`
- `ai_reason`
- `created_at`

Field tambahan yang aman ditambah:

- `status`
- `source`
- `has_audio`
- `has_image`
- `booking_status`
- `updated_at`
- `session_id`

Contoh object dashboard:

```json
{
  "id": "case_123",
  "name": "B*** S******",
  "phone": "0812*******",
  "symptoms": "sesak napas sejak 2 jam",
  "triage": "MERAH",
  "ai_reason": "Indikasi distress respirasi dan nyeri dada akut.",
  "created_at": "2026-04-21T10:00:00Z",
  "updated_at": "2026-04-21T10:01:00Z",
  "status": "triaged",
  "source": "whatsapp",
  "has_audio": true,
  "has_image": false,
  "booking_status": "pending",
  "session_id": "session_001"
}
```

## Environment dan Dependency

### Env vars minimum

- `PORT`
- `GOOGLE_CLOUD_PROJECT`
- `FIRESTORE_DATABASE_ID` jika dipakai
- `VERTEX_LOCATION`
- `VERTEX_MODEL`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_APP_SECRET` bila signature verification dipakai
- `GOOGLE_CALENDAR_ID`

### Dependency eksternal minimum

- WhatsApp Business API
- Vertex AI
- Firestore
- Google Calendar API
- Cloud Run deployment target

## Struktur Folder Yang Disarankan

Struktur ini tidak wajib diubah sekaligus, tapi ini bentuk yang sehat untuk backend real.

```text
backend/
  main.go
  docs/
    backend-plan.md
  config/
    env.go
  handlers/
    webhook.go
    websocket.go
    health.go
  middleware/
    anonymizer.go
    requestid.go
  models/
    patient.go
    session.go
    case.go
    message.go
  services/
    firestore.go
    gemini.go
    whatsapp.go
    media.go
    calendar.go
  repositories/
    case_repository.go
    session_repository.go
  internal/
    orchestrator/
    audit/
    security/
```

## Phase Implementasi Backend

### Phase 0 - Alignment dan kontrak data

Tujuan:

- menyepakati kontrak data FE-BE
- menyepakati field minimum dashboard
- menyepakati scope demo hackathon

Task detail:

- finalisasi object `case` untuk frontend
- finalisasi env vars dan secret list
- tentukan scope MVP vs stretch goal

Dependency:

- sinkron dengan frontend

Output:

- kontrak data final
- daftar env final
- daftar scope final

Acceptance criteria:

- frontend dan backend sepakat field utama
- tidak ada endpoint kritikal yang ambigu

### Phase 1 - Hardening fondasi service

Tujuan:

- membuat backend siap dikembangkan tanpa terus mengganti fondasi

Task detail:

- tambah `GET /healthz`
- pindahkan port dan config ke env
- tambah request logging dasar
- rapikan error response JSON
- siapkan package config dasar

File yang kemungkinan disentuh:

- `main.go`
- `handlers/health.go`
- `config/env.go`

Output:

- backend punya config yang rapi
- health check bisa dipakai Cloud Run

Acceptance criteria:

- service bisa jalan dari env
- `GET /healthz` mengembalikan status sehat

### Phase 2 - WhatsApp ingress real

Tujuan:

- menerima webhook Meta yang asli

Task detail:

- buat endpoint verification
- buat endpoint inbound event
- parsing payload Meta ke model internal
- normalize text, audio, image messages
- tambah signature verification bila memungkinkan

File yang kemungkinan disentuh:

- `handlers/webhook.go`
- `services/whatsapp.go`
- `models/message.go`

Output:

- backend bisa menerima event WhatsApp asli

Acceptance criteria:

- verification challenge berhasil
- payload text berhasil diparse ke model internal
- payload image/audio dikenali tipenya

### Phase 3 - Persistence dan session store

Tujuan:

- mengganti memory store dengan Firestore

Task detail:

- buat client Firestore
- buat repository session dan case
- simpan inbound case dan message
- ambil data list pasien untuk dashboard
- simpan dan baca session summary

File yang kemungkinan disentuh:

- `services/firestore.go`
- `repositories/*`
- `models/session.go`
- `models/case.go`

Output:

- data bertahan setelah restart
- session dan case bisa dilacak

Acceptance criteria:

- data yang masuk terlihat di Firestore
- `GET /api/patients` membaca dari persistence nyata

### Phase 4 - Privacy dan media pipeline

Tujuan:

- menyiapkan data aman sebelum masuk ke AI

Task detail:

- ubah redaction dari raw body regex menjadi field-aware masking
- download media dari WhatsApp API
- validasi mime type dan ukuran file
- strip EXIF image
- siapkan transcript input atau audio descriptor

File yang kemungkinan disentuh:

- `middleware/anonymizer.go`
- `services/media.go`
- `services/whatsapp.go`

Output:

- backend bisa memproses image/audio dengan aman

Acceptance criteria:

- phone/NIK termask di payload internal yang aman
- metadata gambar tidak ikut dipakai di pipeline

### Phase 5 - Vertex AI orchestrator

Tujuan:

- mengganti AI dummy menjadi AI real

Task detail:

- integrasi client Vertex AI
- bikin prompt triage yang ketat
- minta output JSON terstruktur
- tambahkan fallback/error handling
- mapping response model ke object case

File yang kemungkinan disentuh:

- `services/gemini.go`
- `internal/orchestrator/*`

Output:

- triage tidak lagi random

Acceptance criteria:

- request text menghasilkan triage konsisten
- response memuat triage, reason, dan next step

### Phase 6 - Realtime dashboard bridge

Tujuan:

- menjaga frontend tetap realtime tanpa refactor besar

Task detail:

- setelah save case, broadcast event ke websocket
- dukung event urgent untuk triage merah
- rapikan payload event websocket

File yang kemungkinan disentuh:

- `handlers/websocket.go`
- `handlers/webhook.go`

Output:

- frontend langsung update setelah ada case baru

Acceptance criteria:

- pasien baru muncul realtime di dashboard
- case merah bisa dibedakan sebagai urgent event

### Phase 7 - Scheduling dan action layer

Tujuan:

- memberi nilai agentic nyata ke demo

Task detail:

- implement tool cek availability
- implement tool booking calendar
- simpan hasil booking ke Firestore
- kirim konfirmasi ke pasien

File yang kemungkinan disentuh:

- `services/calendar.go`
- `services/whatsapp.go`
- `internal/orchestrator/*`

Output:

- sistem bisa mengambil action administratif

Acceptance criteria:

- booking test berhasil masuk ke calendar
- booking status tampil di case

### Phase 8 - Audit, logging, dan security

Tujuan:

- membuat backend layak dipresentasikan dari sisi cyber dan operasional

Task detail:

- structured logging
- audit event per state transition
- jangan log raw token dan raw PII
- secret handling lewat env atau Secret Manager
- rapikan CORS dan validation

File yang kemungkinan disentuh:

- `main.go`
- `internal/audit/*`
- `internal/security/*`

Output:

- backend lebih aman dan lebih mudah dijelaskan ke juri

Acceptance criteria:

- setiap case punya audit event penting
- log tidak membocorkan secret/token sensitif

## Prioritas MVP Backend

### Priority 1

- Phase 0
- Phase 1
- Phase 2 untuk text inbound
- Phase 3
- Phase 5 untuk text triage
- Phase 6

### Priority 2

- audio dan image handling
- session summary yang lebih kaya
- status flow lengkap
- audit log dasar

### Priority 3

- scheduling Google Calendar
- escalation flow yang lebih kaya
- security hardening tambahan

## Task Breakdown Tim Backend

### Kevin

- webhook WhatsApp
- media pipeline
- Vertex AI orchestration
- prompt dan function routing

### Ario

- Firestore integration
- websocket/dashboard bridge
- calendar integration
- logging, security, deployment

## Test Checklist Backend

### Unit/integration minimum

- [ ] webhook verification pass
- [ ] payload text bisa diparse
- [ ] payload audio/image dikenali
- [ ] patient case tersimpan ke Firestore
- [ ] `GET /api/patients` menampilkan data terbaru
- [ ] websocket broadcast berjalan
- [ ] response triage structured berhasil diparse
- [ ] booking test tersimpan bila scheduling aktif

### Manual test minimum

- [ ] kirim text WhatsApp dan lihat case muncul di dashboard
- [ ] kirim audio atau image dan lihat flow tidak crash
- [ ] simulasi triage merah dan lihat alert realtime
- [ ] restart backend dan pastikan data lama tidak hilang

## Risiko dan Mitigasi

### Risiko 1 - Integrasi WhatsApp makan waktu

Mitigasi:

- siapkan payload capture contoh dari Meta lebih awal
- bangun parser text dulu, lalu audio/image

### Risiko 2 - Vertex AI output tidak stabil

Mitigasi:

- pakai output JSON ketat
- validasi response sebelum disimpan
- siapkan fallback default

### Risiko 3 - FE-BE mismatch

Mitigasi:

- pegang kontrak data yang konsisten
- tambahkan field baru tanpa menghapus field lama

### Risiko 4 - Scheduling terlalu banyak makan waktu

Mitigasi:

- jadikan scheduling priority kedua setelah triage realtime hidup

## Definisi Selesai Backend

Backend dianggap cukup untuk demo bila:

1. WhatsApp text inbound masuk ke backend real.
2. Data tersimpan di Firestore.
3. Vertex AI menghasilkan triage yang bukan random.
4. Dashboard frontend update realtime.
5. Case merah bisa terlihat jelas.
6. Minimal satu alur action agent berjalan, idealnya scheduling.

## Kesimpulan

Backend yang sekarang sudah benar sebagai skeleton, tetapi inti produk masih belum hidup. Urutan implementasi yang paling aman adalah:

1. rapikan fondasi
2. hidupkan ingress real
3. hidupkan persistence real
4. hidupkan AI real
5. jaga realtime dashboard
6. tambahkan action layer
7. baru hardening akhir

Kalau urutan ini diikuti, backend kalian akan naik dari mock demo menjadi backend agentic triage yang benar-benar layak dipresentasikan.
