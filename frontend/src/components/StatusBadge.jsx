import React from 'react';

const STATUS_MAP = {
  received:              { label: 'Diterima',       cls: 'bg-slate-700 text-slate-300' },
  analyzing:             { label: 'Dianalisis',     cls: 'bg-blue-900/50 text-blue-300 border border-blue-700/50' },
  triaged:               { label: 'Tertriase',      cls: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' },
  escalated:             { label: 'Eskalasi',       cls: 'bg-red-900/50 text-red-300 border border-red-700/50 animate-pulse' },
  awaiting_clarification:{ label: 'Perlu Klarifikasi', cls: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50' },
  scheduled:             { label: 'Terjadwal',      cls: 'bg-purple-900/50 text-purple-300 border border-purple-700/50' },
  closed:                { label: 'Selesai',        cls: 'bg-slate-800 text-slate-500' },
  failed:                { label: 'Gagal',          cls: 'bg-red-950 text-red-400' },
};

export function StatusBadge({ status }) {
  if (!status) return <span className="text-slate-600 text-xs">—</span>;
  const cfg = STATUS_MAP[status] ?? { label: status, cls: 'bg-slate-700 text-slate-300' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
