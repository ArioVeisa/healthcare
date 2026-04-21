/**
 * Format string ISO date ke format waktu yang mudah dibaca.
 * @param {string} isoString - Date dalam format ISO
 * @returns {string} - Waktu terformat
 */
export function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format string ISO date ke format datetime lengkap.
 * @param {string} isoString - Date dalam format ISO
 * @returns {string} - Datetime terformat
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
