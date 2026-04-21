import React, { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';

const AUTO_DISMISS_MS = 8000;

/**
 * AlertBanner muncul saat ada pasien baru triage MERAH.
 * Auto-dismiss setelah 8 detik, bisa ditutup manual.
 */
export function AlertBanner({ patient, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [patient?.id]); // Re-trigger saat patient baru

  if (!visible || !patient) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-4 px-5 py-3 rounded-xl bg-triage-red-bg/30 border border-triage-red-border text-triage-red-text mb-4 animate-pulse-once shadow-lg shadow-red-900/30"
    >
      <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <span className="font-bold uppercase tracking-wider text-sm">GAWAT DARURAT — </span>
        <span className="text-sm">
          Pasien baru triage <strong>MERAH</strong>:{' '}
          <span className="font-bold">{patient.name}</span>
          {patient.symptoms ? ` · ${patient.symptoms}` : ''}
        </span>
      </div>
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        className="p-1 rounded-full hover:bg-red-800/40 transition-colors flex-shrink-0"
        aria-label="Tutup peringatan"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
