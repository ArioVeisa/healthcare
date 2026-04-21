import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

export function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-medical-panel border border-medical-accent-dark/50 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-medical-accent text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl sm:text-3xl font-black text-medical-accent-light">{stats.total}</p>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 flex items-center justify-center text-medical-accent">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div className="bg-triage-red-bg/20 border border-triage-red-border/30 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-triage-red-text text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Gawat Darurat</p>
          <p className="text-2xl sm:text-3xl font-black text-triage-red-text">{stats.merah}</p>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-triage-red-bg flex items-center justify-center text-triage-red-text">
          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div className="bg-triage-yellow-bg/20 border border-triage-yellow-border/30 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-triage-yellow-text text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Darurat Tidak Gawat</p>
          <p className="text-2xl sm:text-3xl font-black text-triage-yellow-text">{stats.kuning}</p>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-triage-yellow-bg flex items-center justify-center text-triage-yellow-text">
          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div className="bg-triage-green-bg/20 border border-triage-green-border/30 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-triage-green-text text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Tidak Gawat</p>
          <p className="text-2xl sm:text-3xl font-black text-triage-green-text">{stats.hijau}</p>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-triage-green-bg flex items-center justify-center text-triage-green-text">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
}
