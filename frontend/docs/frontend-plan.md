# Frontend Plan

## Tujuan

Dokumen ini adalah plan implementasi frontend AGHA/NEURA yang lengkap dan bisa langsung dipakai teman frontend untuk eksekusi.

Target akhir frontend:

- menampilkan dashboard triage real-time yang jelas dibaca
- menampilkan urgent case dengan prioritas tinggi
- tetap stabil walau backend reconnect atau error
- siap menerima data dari backend real tanpa refactor besar
- tetap ringan, cepat, dan kuat untuk demo hackathon

Frontend tidak perlu menjadi sistem admin kompleks. Fokusnya adalah dashboard operasional medis yang ringkas, cepat, dan tegas secara visual.

## Ringkasan Kondisi Saat Ini

Yang sudah ada di repo:

- React + Vite
- dashboard utama
- stats cards sederhana
- tabel pasien
- modal detail pasien
- hook websocket untuk realtime
- tema visual yang sudah konsisten

Yang masih kurang:

- loading/error/connection state
- search yang benar-benar aktif
- filter dan sorting
- urgent alert untuk triage merah
- dukungan field data backend yang lebih kaya
- layout mobile yang lebih operasional

## Prinsip Implementasi Frontend

Prinsip yang harus dijaga:

1. Jangan bongkar layout total kalau belum perlu.
2. Dahulukan kejelasan operasional daripada efek visual.
3. Triage merah harus paling menonjol.
4. Dashboard harus tetap bisa dipakai saat data kosong, loading, atau backend putus.
5. Tambahkan komponen seperlunya, jangan over-engineer.
6. Siapkan UI untuk data baru dari backend tanpa merusak tampilan lama.

## Target Scope Frontend

### In scope

- dashboard realtime
- patient table
- patient detail modal
- search dan filter
- connection state
- urgent alert
- status case
- support field tambahan backend

### Nice to have

- sound alert
- pinned urgent queue
- compact mobile layout untuk tablet
- timeline case lebih kaya

### Out of scope untuk MVP

- auth frontend penuh
- halaman admin multi-role
- manajemen user
- analytics page terpisah

## Gap Frontend Lengkap

### 1. Data flow belum robust

Masalah sekarang:

- fetch awal tidak punya loading state nyata
- websocket tidak expose status koneksi
- tidak ada retry policy
- tidak ada deduplication data

Yang harus ditambah:

- `loading`, `error`, `connectionStatus`
- reconnect sederhana
- dedup berdasarkan `id`
- config URL dari env

### 2. Dashboard belum operasional penuh

Masalah sekarang:

- search hanya tampilan
- tidak ada filter triage
- statistik hanya hitung cepat tanpa state lain
- tidak ada urgent banner

Yang harus ditambah:

- search aktif
- filter aktif
- indikator koneksi
- alert khusus `MERAH`

### 3. Modal belum siap untuk backend real

Masalah sekarang:

- hanya menampilkan field dasar
- belum ada source type
- belum ada booking status
- belum ada status case
- belum ada timeline singkat

Yang harus ditambah:

- field tambahan yang aman ditampilkan
- fallback kalau field belum ada
- struktur modal yang lebih modular

### 4. UX untuk kondisi gagal masih lemah

Masalah sekarang:

- empty state bercampur dengan error state
- koneksi terputus tetap terlihat sehat
- tidak ada fallback UI saat backend mati

Yang harus ditambah:

- loading state
- empty state
- error banner
- disconnected badge

### 5. Responsiveness belum siap operasional

Masalah sekarang:

- sidebar dan header penting hilang di mobile
- tabel belum punya strategi tampilan kecil
- modal belum dipastikan nyaman di tablet atau layar sempit

Yang harus ditambah:

- mobile/tablet adaptation
- ringkasan info penting tetap terlihat
- modal dan tabel tetap bisa dibaca di layar kecil

## Tujuan UI dan UX

### Tujuan visual

- triage merah paling menonjol
- data terbaru paling mudah ditemukan
- statistik tetap ringkas di bagian atas
- detail pasien mudah dibaca tanpa scrolling berlebihan

### Tujuan operasional

- dokter/admin tahu status dashboard dalam beberapa detik
- pasien kritis terlihat jelas tanpa perlu klik banyak
- detail kasus mudah dibuka dan ditutup cepat
- jika backend bermasalah, UI memberi tahu dengan jujur

## Flow Frontend Detail

### Flow utama

1. App dibuka.
2. Frontend fetch data awal pasien.
3. Frontend buka websocket.
4. Dashboard hitung summary dari state pasien.
5. Jika ada pasien baru, tabel update realtime.
6. Jika ada pasien merah, urgent indicator muncul.
7. Jika user klik pasien, modal detail terbuka.

### Flow data yang disarankan

1. `initial fetch`
2. `websocket connect`
3. `merge/update state`
4. `derive filtered patients`
5. `derive stats`
6. `render UI`

### Flow untuk koneksi putus

1. websocket `onclose` terpanggil
2. `connectionStatus = disconnected`
3. badge koneksi berubah
4. UI tetap menampilkan data terakhir yang ada
5. reconnect dicoba secara terbatas

### Flow untuk urgent case

1. event pasien baru masuk
2. jika `triage === MERAH`, tandai sebagai urgent
3. tampilkan alert banner atau toast
4. highlight row pasien terkait

## Kontrak Data Yang Harus Siap Diterima FE

Field yang harus tetap didukung:

- `id`
- `name`
- `phone`
- `symptoms`
- `triage`
- `ai_reason`
- `created_at`

Field tambahan yang harus mulai disiapkan:

- `status`
- `source`
- `has_audio`
- `has_image`
- `booking_status`
- `session_id`
- `updated_at`

Contoh object target:

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

## Struktur Komponen Yang Disarankan

Struktur ini tetap minimal, tapi cukup rapi untuk scale moderate.

```text
frontend/
  src/
    components/
      AlertBanner.jsx
      ConnectionBadge.jsx
      FilterBar.jsx
      PatientModal.jsx
      PatientTable.jsx
      SearchBar.jsx
      StatsCards.jsx
      StatusBadge.jsx
    hooks/
      usePatients.js
      useWebSocket.js
    lib/
      api.js
      config.js
      patient-utils.js
    App.jsx
    main.jsx
```

## Environment dan Dependency

### Env vars minimum

- `VITE_API_BASE_URL`
- `VITE_WS_URL`

### Dependency UI saat ini sudah cukup untuk MVP

- React
- Vite
- Tailwind
- Lucide icons

Tidak wajib menambah library state management baru untuk scope sekarang.

## Phase Implementasi Frontend

### Phase 0 - Alignment kontrak data

Tujuan:

- menyamakan kontrak data dengan backend
- menyepakati field yang wajib ditampilkan

Task detail:

- sepakati field case minimum
- sepakati event websocket minimum
- sepakati field tambahan yang boleh null

Dependency:

- sinkron dengan backend

Output:

- FE tidak menebak-nebak shape data

Acceptance criteria:

- frontend dan backend memakai field yang sama

### Phase 1 - Rapikan data layer

Tujuan:

- membuat frontend tahan terhadap loading, error, dan reconnect

Task detail:

- pindahkan URL backend ke env/config
- rapikan `useWebSocket`
- tambahkan `loading`, `error`, `connectionStatus`
- tambahkan reconnect sederhana
- tambahkan dedup by `id`

File yang kemungkinan disentuh:

- `src/hooks/useWebSocket.js`
- `src/lib/config.js`
- `src/lib/api.js`

Output:

- data flow lebih stabil

Acceptance criteria:

- app tetap render walau backend gagal sementara
- state koneksi terlihat di UI

### Phase 2 - Rapikan shell dashboard

Tujuan:

- membuat layout inti lebih jujur dan operasional

Task detail:

- ubah status server agar berdasarkan state nyata
- bedakan loading, empty, dan error
- buat komponen `ConnectionBadge`
- buat komponen `StatsCards` bila dibutuhkan

File yang kemungkinan disentuh:

- `src/App.jsx`
- `src/components/ConnectionBadge.jsx`
- `src/components/StatsCards.jsx`

Output:

- dashboard lebih informatif

Acceptance criteria:

- user bisa tahu apakah backend sehat atau tidak dari UI

### Phase 3 - Aktifkan search, filter, dan sorting

Tujuan:

- membantu dokter/admin fokus ke case penting

Task detail:

- tambah state search
- filter berdasarkan triage
- sort berdasarkan waktu masuk terbaru
- optional filter status

File yang kemungkinan disentuh:

- `src/App.jsx`
- `src/components/FilterBar.jsx`
- `src/components/SearchBar.jsx`
- `src/components/PatientTable.jsx`

Output:

- table lebih operasional, bukan cuma tampilan live feed

Acceptance criteria:

- search berdasarkan nama/nomor/keluhan bekerja
- filter triage bekerja

### Phase 4 - Tingkatkan patient table

Tujuan:

- membuat list pasien lebih informatif dan lebih cepat dipindai

Task detail:

- tambah status badge
- tambah kolom atau indikator source type
- tambah indikator urgent case
- rapikan empty state dan loading state

File yang kemungkinan disentuh:

- `src/components/PatientTable.jsx`
- `src/components/StatusBadge.jsx`

Output:

- pasien kritis lebih mudah terlihat

Acceptance criteria:

- row pasien merah tampak lebih menonjol
- status case terlihat langsung dari tabel

### Phase 5 - Tingkatkan patient modal

Tujuan:

- menjadikan modal sebagai pusat detail kasus

Task detail:

- tampilkan `status`, `source`, `booking_status`
- tampilkan indikator audio/image
- tambahkan fallback untuk field kosong
- siapkan area timeline ringkas atau metadata kasus

File yang kemungkinan disentuh:

- `src/components/PatientModal.jsx`

Output:

- modal siap untuk backend real

Acceptance criteria:

- modal tetap aman walau beberapa field belum dikirim backend
- informasi inti kasus bisa dibaca cepat

### Phase 6 - Urgent alert dan escalation UX

Tujuan:

- membuat triage merah terasa benar-benar prioritas

Task detail:

- buat `AlertBanner` atau toast untuk merah
- highlight row terbaru yang merah
- optional sound alert
- pertimbangkan urgent queue mini

File yang kemungkinan disentuh:

- `src/App.jsx`
- `src/components/AlertBanner.jsx`
- `src/components/PatientTable.jsx`

Output:

- dashboard terasa realtime dan siap demo IGD

Acceptance criteria:

- case merah baru memicu perubahan visual yang jelas

### Phase 7 - Responsiveness dan polish

Tujuan:

- memastikan frontend usable di laptop dan tablet demo

Task detail:

- rapikan sidebar/header behavior di mobile
- pastikan tabel tidak rusak di layar kecil
- pastikan modal usable di tablet
- rapikan hierarchy spacing dan typography

File yang kemungkinan disentuh:

- `src/App.jsx`
- `src/components/*`
- `src/index.css`

Output:

- UI tetap enak dipakai di beberapa ukuran layar

Acceptance criteria:

- dashboard tetap bisa dipresentasikan di desktop dan tablet tanpa rusak parah

## Perubahan Minimum Pada File Yang Ada Sekarang

### `src/App.jsx`

- tambah state search/filter
- pakai connection status real
- tampilkan alert area
- tampilkan stats dari derived state

### `src/hooks/useWebSocket.js`

- tambah loading/error/status
- tambah reconnect
- tambah dedup dan merge strategy

### `src/components/PatientTable.jsx`

- tambahkan status, source, dan urgency treatment
- bedakan loading, empty, dan error state

### `src/components/PatientModal.jsx`

- tampilkan metadata kasus yang lebih kaya
- tambahkan fallback nilai kosong

## Prioritas MVP Frontend

### Priority 1

- Phase 0
- Phase 1
- Phase 2
- Phase 3

### Priority 2

- Phase 4
- Phase 5
- Phase 6

### Priority 3

- Phase 7
- sound alert
- urgent queue mini

## Test Checklist Frontend

### Manual test minimum

- [ ] app render saat backend hidup
- [ ] app tetap render saat backend mati
- [ ] loading state muncul saat fetch awal
- [ ] error state muncul saat API gagal
- [ ] badge koneksi berubah saat websocket putus
- [ ] pasien baru muncul realtime
- [ ] search bekerja
- [ ] filter triage bekerja
- [ ] modal tetap aman untuk data partial
- [ ] alert merah muncul saat case merah masuk

### UX checklist minimum

- [ ] triage merah paling terlihat
- [ ] status server tidak bohong
- [ ] empty state tidak membingungkan
- [ ] user bisa paham kondisi dashboard dalam beberapa detik

## Risiko dan Mitigasi

### Risiko 1 - Shape data backend berubah-ubah

Mitigasi:

- tambahkan fallback value
- treat field tambahan sebagai optional

### Risiko 2 - Realtime menimbulkan data dobel

Mitigasi:

- dedup berdasarkan `id`
- tentukan merge strategy yang jelas

### Risiko 3 - UI terlalu ramai

Mitigasi:

- tambahkan fitur operasional seperlunya
- hindari terlalu banyak panel baru

### Risiko 4 - Mobile rusak saat data padat

Mitigasi:

- uji dashboard di lebar tablet dan mobile kecil
- prioritaskan informasi inti

## Definisi Selesai Frontend

Frontend dianggap cukup untuk demo bila:

1. dashboard mengambil data awal dari backend
2. websocket realtime stabil secara dasar
3. koneksi/loading/error state terlihat jelas
4. search dan filter dasar bekerja
5. triage merah terlihat paling menonjol
6. modal siap menerima data backend yang lebih kaya

## Kesimpulan

Frontend yang sekarang sudah punya pondasi visual yang bagus. Yang perlu dilakukan bukan rombak total, melainkan membuatnya lebih operasional, lebih jujur terhadap kondisi data, dan lebih siap untuk backend real.

Urutan implementasi yang paling aman adalah:

1. rapikan data layer
2. tampilkan state koneksi dan loading yang benar
3. aktifkan search/filter
4. tonjolkan urgent case
5. kayakan modal detail
6. baru polish responsive dan demo UX

Kalau urutan ini diikuti, frontend kalian akan naik dari dashboard demo statis menjadi dashboard operasional yang layak dipresentasikan bareng backend agentic.
