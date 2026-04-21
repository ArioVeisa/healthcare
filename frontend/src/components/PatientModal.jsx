import React from 'react';
import {
  X, Activity, AlertTriangle, ShieldCheck,
  Mic, Image, MessageCircle, Calendar, Clock,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../lib/patient-utils';

export function PatientModal({ patient, onClose }) {
  if (!patient) return null;

  // ── Triage color ────────────────────────────────────────────────────────
  const triageStyles = {
    MERAH:  'bg-triage-red-bg text-triage-red-text border-triage-red-border',
    KUNING: 'bg-triage-yellow-bg text-triage-yellow-text border-triage-yellow-border',
    HIJAU:  'bg-triage-green-bg text-triage-green-text border-triage-green-border',
  };
  const currentStyle = triageStyles[patient.triage] ?? 'bg-slate-700 text-medical-accent-light border-slate-600';

  // ── Booking label ───────────────────────────────────────────────────────
  const bookingLabel = {
    pending:   { text: 'Menunggu',   cls: 'text-yellow-400' },
    confirmed: { text: 'Dikonfirmasi', cls: 'text-emerald-400' },
    none:      { text: 'Belum ada',  cls: 'text-slate-500' },
  };
  const bk = bookingLabel[patient.booking_status] ?? { text: patient.booking_status ?? '—', cls: 'text-slate-400' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-medical-panel w-full max-w-2xl border border-medical-accent-dark/30 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className={`p-4 sm:p-6 border-b flex justify-between items-center ${currentStyle}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            <h2 className="text-lg sm:text-xl font-bold tracking-wide">Data Pasien: {patient.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 custom-scrollbar">

          {/* Row 1: Triage + Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <InfoCard label="Status Triase">
              <span className="font-bold text-base sm:text-lg">{patient.triage ?? '—'}</span>
            </InfoCard>
            <InfoCard label="Kontak Masuk">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg truncate">{patient.phone ?? '—'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" title="PII Anonymized" />
              </div>
            </InfoCard>
          </div>

          {/* Row 2: Status Case + Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <InfoCard label="Status Case">
              <StatusBadge status={patient.status} />
            </InfoCard>
            <InfoCard label="Sumber">
              <div className="flex items-center gap-2 font-semibold text-medical-accent-light">
                {patient.source === 'whatsapp' ? (
                  <>
                    <MessageCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    WhatsApp
                  </>
                ) : (
                  patient.source ?? '—'
                )}
              </div>
            </InfoCard>
          </div>

          {/* Row 3: Media + Booking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <InfoCard label="Media Terlampir">
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${patient.has_audio ? 'text-blue-400' : 'text-slate-600'}`}>
                  <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  {patient.has_audio ? 'Audio' : 'Tidak ada'}
                </span>
                <span className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${patient.has_image ? 'text-purple-400' : 'text-slate-600'}`}>
                  <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  {patient.has_image ? 'Gambar' : 'Tidak ada'}
                </span>
              </div>
            </InfoCard>
            <InfoCard label="Status Booking">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className={`font-semibold text-sm sm:text-base ${bk.cls}`}>{bk.text}</span>
              </div>
            </InfoCard>
          </div>

          {/* Row 4: Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <InfoCard label="Waktu Masuk">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                {formatDateTime(patient.created_at)}
              </div>
            </InfoCard>
            <InfoCard label="Terakhir Update">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                {formatDateTime(patient.updated_at)}
              </div>
            </InfoCard>
          </div>

          {/* Keluhan */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-semibold text-medical-accent uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Keluhan Medis
            </h3>
            <div className="bg-medical-dark p-3 sm:p-4 rounded-xl border border-medical-accent-dark/50 text-medical-accent-light min-h-[60px] text-sm sm:text-base">
              {patient.symptoms ?? <span className="text-slate-600">Tidak tersedia</span>}
            </div>
          </div>

          {/* Gemini Analysis */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Gemini AI 1.5 Pro Analysis
            </h3>
            <div className="bg-medical-dark p-3 sm:p-4 rounded-xl border border-medical-accent-dark/50 text-medical-accent-light leading-relaxed font-light border-l-2 border-l-emerald-500 min-h-[60px] text-sm sm:text-base">
              {patient.ai_reason ?? <span className="text-slate-600 italic">Analisis belum tersedia.</span>}
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="p-3 sm:p-4 border-t border-medical-accent-dark/30 bg-medical-dark/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            Tutup Rekam Medis
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Helper component ──────────────────────────────────────────────────────────
function InfoCard({ label, children }) {
  return (
    <div className="bg-medical-dark p-3 sm:p-4 rounded-xl border border-medical-accent-dark/50">
      <span className="text-medical-accent text-[10px] sm:text-xs font-semibold uppercase tracking-wider block mb-1.5 sm:mb-2">
        {label}
      </span>
      {children}
    </div>
  );
}
