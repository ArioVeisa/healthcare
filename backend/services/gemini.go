package services

import (
	"math/rand"
	"time"
)

// AnalyzeTriage memanggil Vertex AI (Mock/Dummy) untuk menentukan level triage.
func AnalyzeTriage(symptoms string) (triage string, reason string) {
	// CATATAN LOMBA: Di sini Anda akan memasukkan `client.GenerateContent()` dari Vertex AI SDK
	// Mock time execution Vertex AI (delay buatan)
	time.Sleep(500 * time.Millisecond)

	r := rand.Intn(100)

	if r < 30 {
		return "MERAH", "Pasien mengalami gejala kritis berdasarkan Gemini AI Analysis terhadap keluhan yang diberikan. Membutuhkan tindakan Life-Saving atau resusitasi segera agar tidak berakibat fatal."
	} else if r < 70 {
		return "KUNING", "Pasien perlu penanganan secepatnya. Indikasi menunjukkan kegawatdaruratan yang nyata, namun hemodinamik masih cukup stabil (Triage Darurat Tidak Gawat)."
	}
	return "HIJAU", "Pasien dalam kondisi tidak gawat darurat. Keluhan dinilai ringan dan bisa ditangani di poliklinik atau fasilitas kesehatan primer secara tidak terburu-buru."
}
