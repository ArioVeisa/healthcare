import React from 'react';
import { Clock, ExternalLink, Mic, Image, MessageCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatTime } from '../lib/patient-utils';

// Skeleton satu baris
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 sm:px-6 py-4">
          <div className="h-4 bg-slate-700 rounded animate-pulse" style={{ width: `${60 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function PatientTable({ patients, loading, onSelectPatient }) {
  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-medical-accent-dark/50 custom-scrollbar shadow-lg">
        <table className="w-full text-left text-sm whitespace-nowrap bg-medical-panel">
          <TableHead />
          <tbody className="divide-y divide-slate-800">
            {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (!patients || patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-medical-panel rounded-xl border border-medical-accent-dark/50 border-dashed text-center">
        <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mb-4 animate-pulse" />
        <p className="text-medical-accent font-medium text-sm sm:text-base">Menunggu data masuk dari WhatsApp API...</p>
        <p className="text-slate-600 text-xs sm:text-sm mt-1">Belum ada pasien yang sesuai filter saat ini.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-medical-accent-dark/50 custom-scrollbar shadow-lg">
      <table className="w-full text-left text-sm whitespace-nowrap bg-medical-panel">
        <TableHead />
        <tbody className="divide-y divide-slate-800">
          {patients.map((patient) => (
            <PatientRow key={patient.id} patient={patient} onSelect={onSelectPatient} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableHead() {
  return (
    <thead className="bg-medical-dark border-b border-medical-accent-dark/50 text-medical-accent">
      <tr>
        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Triage</th>
        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Waktu</th>
        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Nama Pasien</th>
        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Keluhan Utama</th>
        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Status</th>
        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-right">Aksi</th>
      </tr>
    </thead>
  );
}

function PatientRow({ patient, onSelect }) {
  // ── Triage styling ─────────────────────────────────────────────────────
  let badgeStyle = 'bg-slate-700 text-medical-accent-light';
  let rowStyle   = 'hover:bg-slate-800/60';
  let urgentRing = '';

  if (patient.triage === 'MERAH') {
    badgeStyle = 'bg-triage-red-bg text-triage-red-text border border-triage-red-border';
    rowStyle   = 'bg-red-950/20 hover:bg-red-900/30';
    urgentRing = 'border-l-2 border-l-triage-red-border';
  } else if (patient.triage === 'KUNING') {
    badgeStyle = 'bg-triage-yellow-bg text-triage-yellow-text border border-triage-yellow-border';
    rowStyle   = 'hover:bg-yellow-900/10';
  } else if (patient.triage === 'HIJAU') {
    badgeStyle = 'bg-triage-green-bg text-triage-green-text border border-triage-green-border';
    rowStyle   = 'hover:bg-emerald-900/10';
  }

  const timeString = formatTime(patient.created_at);

  return (
    <tr className={`transition-colors duration-200 ${rowStyle} ${urgentRing}`}>
      {/* Triage badge */}
      <td className="px-4 sm:px-6 py-3 sm:py-4">
        <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wider ${badgeStyle}`}>
          {patient.triage ?? '—'}
        </span>
      </td>

      {/* Waktu */}
      <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-medical-accent-light">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
          {timeString}
        </div>
      </td>

      {/* Nama + media indicator */}
      <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-medical-accent-light">
        <div className="flex items-center gap-2">
          {patient.source === 'whatsapp' && (
            <MessageCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" title="Via WhatsApp" />
          )}
          <span>{patient.name}</span>
          {patient.has_audio && (
            <Mic className="w-3 h-3 text-blue-400 flex-shrink-0" title="Audio terlampir" />
          )}
          {patient.has_image && (
            <Image className="w-3 h-3 text-purple-400 flex-shrink-0" title="Gambar terlampir" />
          )}
        </div>
      </td>

      {/* Keluhan */}
      <td className="px-4 sm:px-6 py-3 sm:py-4 text-medical-accent">
        <div className="max-w-[120px] sm:max-w-xs truncate" title={patient.symptoms}>
          {patient.symptoms ?? '—'}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 sm:px-6 py-3 sm:py-4">
        <StatusBadge status={patient.status} />
      </td>

      {/* Aksi */}
      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
        <button
          onClick={() => onSelect(patient)}
          className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-medical-accent rounded-lg font-medium transition-all text-xs sm:text-sm"
        >
          Detail <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </td>
    </tr>
  );
}
