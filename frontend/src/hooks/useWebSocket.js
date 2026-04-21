import { useState, useEffect, useRef } from 'react';

export function useWebSocket(url) {
  const [patients, setPatients] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    // 1. Ambil data pasien awal via REST API
    fetch('http://localhost:8080/api/patients')
      .then((res) => res.json())
      .then((data) => {
        if (data) setPatients(data);
      })
      .catch((err) => console.error('Failed to fetch initial patients', err));

    // 2. Hubungkan ke WebSocket untuk realtime updates
    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      try {
        const newPatient = JSON.parse(event.data);
        // Prepend patient baru di paling atas tabel
        setPatients((prev) => [newPatient, ...prev]);
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket Connection Closed');
    };

    return () => {
      ws.current?.close();
    };
  }, [url]);

  return { patients };
}
