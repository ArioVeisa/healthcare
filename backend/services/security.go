package services

import (
	"crypto/hmac"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"regexp"
	"strings"
)

var (
	phoneRegex = regexp.MustCompile(`(?:\+62|62|0)8[0-9]{8,11}`)
	ktpRegex   = regexp.MustCompile(`\b\d{16}\b`)
)

// NormalizePhone menyamakan format nomor agar satu pasien tetap mengarah ke session yang sama.
func NormalizePhone(phone string) string {
	cleaned := strings.TrimSpace(phone)
	cleaned = strings.ReplaceAll(cleaned, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")

	if strings.HasPrefix(cleaned, "+62") {
		return "0" + strings.TrimPrefix(cleaned, "+62")
	}

	if strings.HasPrefix(cleaned, "62") {
		return "0" + strings.TrimPrefix(cleaned, "62")
	}

	return cleaned
}

// MaskPhone menyisakan awalan nomor untuk kebutuhan operasional dashboard.
func MaskPhone(phone string) string {
	normalized := NormalizePhone(phone)
	if normalized == "" {
		return "Nomor tidak diketahui"
	}

	if len(normalized) <= 4 {
		return normalized
	}

	return normalized[:4] + strings.Repeat("*", len(normalized)-4)
}

// MaskName menjaga identitas tetap terbaca seperlunya tanpa menampilkan nama lengkap penuh.
func MaskName(name string) string {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return "Pasien Anonim"
	}

	words := strings.Fields(trimmed)
	masked := make([]string, 0, len(words))

	for _, word := range words {
		runes := []rune(word)
		if len(runes) <= 1 {
			masked = append(masked, string(runes))
			continue
		}

		masked = append(masked, string(runes[0])+strings.Repeat("*", len(runes)-1))
	}

	return strings.Join(masked, " ")
}

// RedactSensitiveText menyamarkan pola PII sederhana pada teks bebas.
func RedactSensitiveText(text string) string {
	if strings.TrimSpace(text) == "" {
		return text
	}

	redacted := phoneRegex.ReplaceAllStringFunc(text, MaskPhone)
	redacted = ktpRegex.ReplaceAllStringFunc(redacted, func(match string) string {
		return match[:4] + strings.Repeat("*", 8) + match[12:]
	})

	return redacted
}

// HashIdentity menghasilkan identifier stabil untuk session pasien.
func HashIdentity(value string) string {
	sum := sha1.Sum([]byte(strings.TrimSpace(strings.ToLower(value))))
	return hex.EncodeToString(sum[:])
}

// VerifyWhatsAppSignature memvalidasi header X-Hub-Signature-256 jika app secret tersedia.
func VerifyWhatsAppSignature(body []byte, signatureHeader, appSecret string) error {
	if strings.TrimSpace(appSecret) == "" {
		return nil
	}

	signatureHeader = strings.TrimSpace(signatureHeader)
	if signatureHeader == "" {
		return errors.New("missing X-Hub-Signature-256 header")
	}

	const prefix = "sha256="
	if !strings.HasPrefix(signatureHeader, prefix) {
		return errors.New("invalid signature format")
	}

	provided := strings.TrimPrefix(signatureHeader, prefix)
	mac := hmac.New(sha256.New, []byte(appSecret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(provided), []byte(expected)) {
		return errors.New("signature verification failed")
	}

	return nil
}
