import React from 'react';

const FILTERS = [
  { value: 'ALL',   label: 'Semua',        activeClass: 'bg-slate-700 text-white' },
  { value: 'MERAH', label: '🔴 Merah',     activeClass: 'bg-triage-red-bg text-triage-red-text border border-triage-red-border' },
  { value: 'KUNING',label: '🟡 Kuning',    activeClass: 'bg-triage-yellow-bg text-triage-yellow-text border border-triage-yellow-border' },
  { value: 'HIJAU', label: '🟢 Hijau',     activeClass: 'bg-triage-green-bg text-triage-green-text border border-triage-green-border' },
];

export function FilterBar({ activeFilter, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border border-transparent ${
            activeFilter === f.value
              ? f.activeClass
              : 'text-medical-accent hover:bg-slate-800 hover:text-medical-accent-light'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
