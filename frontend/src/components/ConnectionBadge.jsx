import React from 'react';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';

const STATUS_CONFIG = {
  connected: {
    label: 'Koneksi Stabil',
    icon: Wifi,
    dotClass: 'bg-emerald-400 animate-pulse',
    textClass: 'text-emerald-400',
  },
  disconnected: {
    label: 'Terputus',
    icon: WifiOff,
    dotClass: 'bg-red-500',
    textClass: 'text-red-400',
  },
  reconnecting: {
    label: 'Menghubungkan...',
    icon: RotateCcw,
    dotClass: 'bg-yellow-400 animate-pulse',
    textClass: 'text-yellow-400',
  },
  connecting: {
    label: 'Menghubungkan...',
    icon: RotateCcw,
    dotClass: 'bg-yellow-400 animate-pulse',
    textClass: 'text-yellow-400',
  },
};

export function ConnectionBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.disconnected;
  const Icon = cfg.icon;

  return (
    <div className="bg-medical-panel p-4 rounded-xl border border-medical-accent-dark/30">
      <div className="text-xs text-medical-accent mb-2 uppercase font-bold tracking-wider">
        Status Server
      </div>
      <div className={`flex items-center gap-2 font-medium text-sm ${cfg.textClass}`}>
        <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
        <Icon className="w-4 h-4" />
        {cfg.label}
      </div>
    </div>
  );
}
