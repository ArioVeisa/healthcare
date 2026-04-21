import { API_BASE_URL } from './config';

/**
 * Mengambil daftar pasien dari REST API backend.
 * Mengembalikan array pasien atau array kosong jika gagal.
 */
export async function fetchPatients() {
  const res = await fetch(`${API_BASE_URL}/api/patients`);
  if (!res.ok) {
    throw new Error(`Failed to fetch patients: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  // Backend bisa mengembalikan null jika belum ada data
  return Array.isArray(data) ? data : [];
}
