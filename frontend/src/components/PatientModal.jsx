import React from 'react';
import { X, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

export function PatientModal({ patient, onClose }) {
  if (!patient) return null;

  // Render Triage Color Styling
  const triageStyles = {
    MERAH: 'bg-triage-red-bg text-triage-red-text border-triage-red-border',
    KUNING: 'bg-triage-yellow-bg text-triage-yellow-text border-triage-yellow-border',
    HIJAU: 'bg-triage-green-bg text-triage-green-text border-triage-green-border',
  };

  const currentStyle = triageStyles[patient.triage] || 'bg-slate-700 text-medical-accent-light border-slate-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-medical-panel w-full max-w-2xl border border-medical-accent-dark/30 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${currentStyle}`}>
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <h2 className="text-xl font-bold tracking-wide">
              Data Pasien: {patient.name}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-black/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-medical-dark p-4 rounded-xl border border-medical-accent-dark/50">
              <span className="text-medical-accent text-xs font-semibold uppercase tracking-wider block mb-1">Status Triase</span>
              <span className="font-bold text-lg">{patient.triage}</span>
            </div>
            <div className="bg-medical-dark p-4 rounded-xl border border-medical-accent-dark/50">
              <span className="text-medical-accent text-xs font-semibold uppercase tracking-wider block mb-1">Kontak Masuk</span>
              <div className="flex items-center gap-2">
			    <span className="font-bold text-lg">{patient.phone}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" title="PII Anonymized by Middleware" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-medical-accent uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Keluhan Medis
            </h3>
            <div className="bg-medical-dark p-4 rounded-xl border border-medical-accent-dark/50 text-medical-accent-light min-h-[80px]">
              {patient.symptoms}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Gemini AI 1.5 Pro Analysis
            </h3>
            <div className="bg-medical-dark p-4 rounded-xl border border-medical-accent-dark/50 text-medical-accent-light leading-relaxed font-light border-l-2 border-l-emerald-500">
              {patient.ai_reason}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-medical-accent-dark/30 bg-medical-dark/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Tutup Rekam Medis
          </button>
        </div>

      </div>
    </div>
  );
}
