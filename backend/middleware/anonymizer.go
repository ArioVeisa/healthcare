package middleware

import (
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// Regex untuk mendeteksi potensi data PII (Phone dan KTP lokal)
var (
	phoneRegex = regexp.MustCompile(`(\+62|62|0)8[0-9]{8,11}`)
	ktpRegex   = regexp.MustCompile(`\b\d{16}\b`)
)

// AnonymizePII adalah middleware sederhana untuk masking PII di Request Body
func AnonymizePII() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Hanya proses request JSON
		contentType := strings.ToLower(string(c.Request().Header.ContentType()))
		if !strings.HasPrefix(contentType, fiber.MIMEApplicationJSON) {
			return c.Next()
		}

		body := c.Body()
		if len(body) == 0 {
			return c.Next()
		}

		bodyStr := string(body)

		// Mask Phone
		bodyStr = phoneRegex.ReplaceAllStringFunc(bodyStr, func(match string) string {
			if len(match) > 4 {
				return match[:4] + strings.Repeat("*", len(match)-4)
			}
			return match
		})

		// Mask KTP
		bodyStr = ktpRegex.ReplaceAllStringFunc(bodyStr, func(match string) string {
			if len(match) == 16 {
				return match[:4] + strings.Repeat("*", 8) + match[12:]
			}
			return match
		})

		// Timpa body request lama dengan yang sudah aman
		c.Request().SetBody([]byte(bodyStr))

		return c.Next()
	}
}
