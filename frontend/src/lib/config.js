// Konfigurasi URL backend dari environment variable.
// Saat development, fallback ke localhost:8080.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const WS_URL =
  import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/patients';
