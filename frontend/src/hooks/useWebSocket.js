import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchPatients } from '../lib/api';
import { WS_URL } from '../lib/config';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 3000;

/**
 * Hook utama untuk data pasien realtime.
 * Mengelola initial fetch, WebSocket, reconnect, dedup, dan status koneksi.
 */
export function useWebSocket(url = WS_URL) {
  const [patients, setPatients]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  // 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

  const ws         = useRef(null);
  const retryCount = useRef(0);
  const retryTimer = useRef(null);
  const isMounted  = useRef(true);

  // ─── Helper: merge patient baru, dedup by id ──────────────────────────────
  const upsertPatient = useCallback((incoming) => {
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === incoming.id);
      if (idx !== -1) {
        // Update existing
        const updated = [...prev];
        updated[idx] = incoming;
        return updated;
      }
      // Prepend new patient
      return [incoming, ...prev];
    });
  }, []);

  // ─── WebSocket connect ─────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!isMounted.current) return;

    try {
      ws.current = new WebSocket(url);
    } catch {
      setConnectionStatus('disconnected');
      return;
    }

    ws.current.onopen = () => {
      if (!isMounted.current) return;
      retryCount.current = 0;
      setConnectionStatus('connected');
      setError(null);
    };

    ws.current.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data && data.id) upsertPatient(data);
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.current.onclose = () => {
      if (!isMounted.current) return;
      setConnectionStatus('disconnected');

      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        setConnectionStatus('reconnecting');
        retryTimer.current = setTimeout(connect, RETRY_INTERVAL_MS);
      }
    };

    ws.current.onerror = () => {
      if (!isMounted.current) return;
      setError('Koneksi WebSocket error. Mencoba ulang...');
    };
  }, [url, upsertPatient]);

  // ─── Initial fetch + WebSocket ─────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    // 1. Fetch data awal
    setLoading(true);
    fetchPatients()
      .then((data) => {
        if (isMounted.current) {
          setPatients(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          console.error('Initial fetch failed:', err);
          setError('Gagal mengambil data awal. Backend mungkin belum aktif.');
        }
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });

    // 2. Buka WebSocket
    connect();

    return () => {
      isMounted.current = false;
      clearTimeout(retryTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  return { patients, loading, error, connectionStatus };
}
