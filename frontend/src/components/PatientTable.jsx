import React from 'react';
import { Clock, ExternalLink } from 'lucide-react';

export function PatientTable({ patients, onSelectPatient }) {
  if (!patients || patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-medical-panel rounded-xl border border-medical-accent-dark/50 border-dashed">
        <Clock className="w-12 h-12 text-slate-600 mb-4 animate-pulse" />
        <p className="text-medical-accent font-medium">Menunggu data masuk dari WhatsApp API...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-medical-accent-dark/50 custom-scrollbar shadow-lg">
      <table className="w-full text-left text-sm whitespace-nowrap bg-medical-panel">
        <thead className="bg-medical-dark border-b border-medical-accent-dark/50 text-medical-accent">
          <tr>
            <th className="px-6 py-4 font-semibold">Triage</th>
            <th className="px-6 py-4 font-semibold">Waktu Masuk</th>
            <th className="px-6 py-4 font-semibold">Nama Pasien</th>
            <th className="px-6 py-4 font-semibold">Keluhan Utama</th>
            <th className="px-6 py-4 font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {patients.map((patient) => {
            // Triage colors
            let badgeStyle = 'bg-slate-700 text-medical-accent-light';
            let rowStyle = 'hover:bg-medical-panel';

            if (patient.triage === 'MERAH') {
              badgeStyle = 'bg-triage-red-bg text-triage-red-text border border-triage-red-border';
              rowStyle = 'hover:bg-red-900/20';
            } else if (patient.triage === 'KUNING') {
              badgeStyle = 'bg-triage-yellow-bg text-triage-yellow-text border border-triage-yellow-border';
              rowStyle = 'hover:bg-yellow-900/20';
            } else if (patient.triage === 'HIJAU') {
              badgeStyle = 'bg-triage-green-bg text-triage-green-text border border-triage-green-border';
              rowStyle = 'hover:bg-emerald-900/20';
            }

            // Format date time
            const dateObj = new Date(patient.created_at);
            const timeString = isNaN(dateObj.getTime()) 
              ? 'Baru Saja' 
              : dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            return (
              <tr key={patient.id} className={`transition-colors duration-200 ${rowStyle}`}>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${badgeStyle}`}>
                    {patient.triage}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-medical-accent-light">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    {timeString}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-medical-accent-light">{patient.name}</td>
                <td className="px-6 py-4 text-medical-accent">
                  <div className="max-w-xs truncate" title={patient.symptoms}>
                    {patient.symptoms}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onSelectPatient(patient)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-medical-accent rounded-lg font-medium transition-all"
                  >
                    Detail <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
