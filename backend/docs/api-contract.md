# Backend API Contract

Dokumen ini menjelaskan endpoint backend yang saat ini siap dipakai frontend dan integrasi webhook.

## Base URL

Local development:

```text
http://localhost:8080
```

## Persistence Mode

Backend sekarang mendukung beberapa mode persistence:

- `sqlite` (default, paling cepat untuk local/server biasa)
- `firestore`
- fallback `memory` bila driver gagal aktif

Env yang relevan:

```text
PERSISTENCE_DRIVER=sqlite
SQLITE_PATH=data/agha.db
```

Untuk Firestore:

```text
PERSISTENCE_DRIVER=firestore
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Ringkasan Endpoint

### Health dan metadata

- `GET /healthz`
- `GET /api/meta`

### Data dashboard frontend

- `GET /api/patients`
- `GET /api/patients/:id`
- `GET /ws/patients`

### Inbound webhook

- `POST /api/webhook`
- `GET /webhooks/whatsapp`
- `POST /webhooks/whatsapp`

## 1. GET /healthz

Tujuan:

- health check dasar
- dipakai untuk cek service hidup atau tidak

Contoh response:

```json
{
  "status": "ok",
  "app_name": "AGHA Triage Backend",
  "persistence_mode": "memory",
  "supports_whatsapp": true,
  "supports_websocket": true
}
```

## 2. GET /api/meta

Tujuan:

- memberi summary dashboard dan capability backend
- cocok dipakai frontend untuk status shell dashboard

Contoh response:

```json
{
  "total_patients": 12,
  "red_count": 2,
  "yellow_count": 6,
  "green_count": 4,
  "persistence_mode": "memory",
  "supports_whatsapp": true,
  "supports_websocket": true,
  "supports_audio_intake": true,
  "supports_image_intake": true
}
```

## 3. GET /api/patients

Tujuan:

- data awal dashboard frontend
- response sengaja berupa array mentah agar kompatibel dengan FE sekarang

Contoh response:

```json
[
  {
    "id": "c14d2244-b2bc-4f56-b061-d641811d142c",
    "session_id": "936fcf201117fd233415e3df674081bfa1a6a1b6",
    "name": "R*** K*****",
    "phone": "0812********",
    "symptoms": "demam tinggi dan muntah terus sejak tadi malam",
    "triage": "KUNING",
    "ai_reason": "Keluhan menunjukkan kebutuhan penanganan medis cepat.",
    "status": "triaged",
    "source": "legacy-webhook",
    "booking_status": "recommended",
    "created_at": "2026-04-21T18:36:41.442423487+07:00",
    "updated_at": "2026-04-21T18:36:41.442423487+07:00"
  }
]
```

## 4. GET /api/patients/:id

Tujuan:

- detail satu patient case untuk modal atau detail page frontend

Contoh response sukses:

```json
{
  "id": "d1c7ba2d-eb08-47a0-a0a3-f5722e0717bb",
  "session_id": "ecf3ea8ffcdfd9f866f427bbfd827a290b586afe",
  "name": "D*** P******",
  "phone": "0822********",
  "symptoms": "Pasien mengirim voice note. Perlu transkripsi atau klarifikasi lanjutan dari operator medis.",
  "triage": "KUNING",
  "ai_reason": "Sistem menerima media tambahan yang mengindikasikan perlunya pemeriksaan manual atau klarifikasi lebih lanjut.",
  "status": "awaiting_clarification",
  "source": "whatsapp",
  "has_audio": true,
  "booking_status": "recommended",
  "created_at": "2026-04-21T18:36:41.534544025+07:00",
  "updated_at": "2026-04-21T18:36:41.534544025+07:00"
}
```

Contoh response gagal:

```json
{
  "error": "patient not found"
}
```

## 5. POST /api/webhook

Tujuan:

- route legacy/demo yang aman dipakai frontend atau testing lokal
- menerima payload sederhana

Request body:

```json
{
  "name": "Rina Kurnia",
  "phone": "081299887766",
  "symptoms": "demam tinggi dan muntah terus sejak tadi malam"
}
```

Contoh response:

```json
{
  "message": "Analisis Triage Berhasil",
  "triage": "KUNING",
  "status": "triaged",
  "patientId": "c14d2244-b2bc-4f56-b061-d641811d142c",
  "patient": {
    "id": "c14d2244-b2bc-4f56-b061-d641811d142c",
    "session_id": "936fcf201117fd233415e3df674081bfa1a6a1b6",
    "name": "R*** K*****",
    "phone": "0812********",
    "symptoms": "demam tinggi dan muntah terus sejak tadi malam",
    "triage": "KUNING",
    "ai_reason": "Keluhan menunjukkan kebutuhan penanganan medis cepat.",
    "status": "triaged",
    "source": "legacy-webhook",
    "booking_status": "recommended",
    "created_at": "2026-04-21T18:36:41.442423487+07:00",
    "updated_at": "2026-04-21T18:36:41.442423487+07:00"
  }
}
```

## 6. GET /webhooks/whatsapp

Tujuan:

- verification challenge Meta

Query params:

- `hub.mode`
- `hub.verify_token`
- `hub.challenge`

Response:

- plain text challenge string

## 7. POST /webhooks/whatsapp

Tujuan:

- menerima inbound event WhatsApp resmi

Catatan:

- jika `WHATSAPP_APP_SECRET` diisi, endpoint akan memvalidasi header `X-Hub-Signature-256`
- payload text, image, audio, button, dan interactive sudah dikenali

Contoh payload image:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "contacts": [
              {
                "profile": {
                  "name": "Siti Aminah"
                },
                "wa_id": "6282233445566"
              }
            ],
            "messages": [
              {
                "from": "6282233445566",
                "id": "wamid.test.1",
                "type": "image",
                "image": {
                  "id": "media123",
                  "caption": "luka berdarah dan bengkak di tangan"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

Contoh response:

```json
{
  "message": "Analisis Triage Berhasil",
  "triage": "KUNING",
  "status": "triaged",
  "patientId": "08064add-f09c-411e-82d0-1c71a69b7aa5",
  "patient": {
    "id": "08064add-f09c-411e-82d0-1c71a69b7aa5",
    "session_id": "ecf3ea8ffcdfd9f866f427bbfd827a290b586afe",
    "name": "S*** A*****",
    "phone": "0822********",
    "symptoms": "luka berdarah dan bengkak di tangan",
    "triage": "KUNING",
    "ai_reason": "Keluhan menunjukkan kebutuhan penanganan medis cepat.",
    "status": "triaged",
    "source": "whatsapp",
    "has_image": true,
    "booking_status": "recommended",
    "created_at": "2026-04-21T18:55:00+07:00",
    "updated_at": "2026-04-21T18:55:00+07:00"
  }
}
```

## 8. GET /ws/patients

Tujuan:

- channel websocket realtime untuk event patient baru

Payload event:

- backend saat ini mengirim object patient langsung, bukan envelope event
- frontend sekarang sudah cocok dengan format ini

Contoh event:

```json
{
  "id": "d1c7ba2d-eb08-47a0-a0a3-f5722e0717bb",
  "session_id": "ecf3ea8ffcdfd9f866f427bbfd827a290b586afe",
  "name": "D*** P******",
  "phone": "0822********",
  "symptoms": "Pasien mengirim voice note. Perlu transkripsi atau klarifikasi lanjutan dari operator medis.",
  "triage": "KUNING",
  "ai_reason": "Sistem menerima media tambahan yang mengindikasikan perlunya pemeriksaan manual atau klarifikasi lebih lanjut.",
  "status": "awaiting_clarification",
  "source": "whatsapp",
  "has_audio": true,
  "booking_status": "recommended",
  "created_at": "2026-04-21T18:36:41.534544025+07:00",
  "updated_at": "2026-04-21T18:36:41.534544025+07:00"
}
```

## Field Object Patient

Field yang aman dipakai frontend sekarang:

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

## Catatan Kompatibilitas FE

Frontend saat ini masih aman karena:

- `GET /api/patients` tetap return array langsung
- websocket tetap kirim object patient langsung
- field lama tidak dihapus
- field baru hanya menambah kemampuan tanpa merusak kontrak lama
