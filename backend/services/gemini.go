package services

import (
	"strings"
)

// AnalyzeTriage versi sekarang memakai heuristik deterministik sebagai pengganti Vertex AI.
// Signature dibuat lebih kaya agar mudah diganti ke SDK Vertex nanti tanpa mengubah handler besar.
func AnalyzeTriage(symptoms string, hasAudio bool, hasImage bool) (triage string, reason string, status string) {
	normalized := strings.ToLower(strings.TrimSpace(symptoms))

	criticalKeywords := []string{
		"sesak napas",
		"nyeri dada",
		"tidak sadar",
		"kejang",
		"pendarahan hebat",
		"pendarahan berat",
		"stroke",
		"serangan jantung",
		"henti napas",
		"muntah darah",
	}
	urgentKeywords := []string{
		"demam tinggi",
		"muntah terus",
		"pusing berat",
		"cedera",
		"luka",
		"ruam",
		"bengkak",
		"lemah",
		"diare",
		"dehidrasi",
	}

	for _, keyword := range criticalKeywords {
		if strings.Contains(normalized, keyword) {
			return "MERAH", "Keluhan mengandung indikator gawat darurat yang butuh evaluasi medis segera. Sistem menandai kasus ini sebagai prioritas tertinggi untuk tindakan cepat atau eskalasi langsung ke IGD.", "escalated"
		}
	}

	for _, keyword := range urgentKeywords {
		if strings.Contains(normalized, keyword) {
			return "KUNING", "Keluhan menunjukkan kebutuhan penanganan medis cepat. Pasien belum terindikasi kritis penuh, namun tetap perlu penilaian langsung oleh tenaga medis dalam waktu dekat.", "triaged"
		}
	}

	if hasAudio || hasImage {
		return "KUNING", "Sistem menerima media tambahan yang mengindikasikan perlunya pemeriksaan manual atau klarifikasi lebih lanjut. Kasus ditandai menengah agar tenaga medis meninjau konteks multimedia yang dikirim pasien.", "awaiting_clarification"
	}

	if normalized == "" || strings.Contains(normalized, "klarifikasi") || strings.Contains(normalized, "tanpa detail") {
		return "KUNING", "Informasi keluhan belum cukup lengkap untuk triase final. Sistem menyarankan pertanyaan klarifikasi lanjutan agar kondisi pasien dapat dinilai lebih akurat.", "awaiting_clarification"
	}

	return "HIJAU", "Keluhan saat ini lebih sesuai dengan kondisi non-gawat darurat. Pasien tetap perlu dipantau, namun penanganan dapat diarahkan ke layanan rawat jalan atau evaluasi medis terjadwal.", "triaged"
}
