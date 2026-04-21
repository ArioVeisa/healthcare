import React, { useState } from 'react';
import { Activity, Menu, Bell, Search, ShieldAlert } from 'lucide-react';
import { PatientTable } from './components/PatientTable';
import { PatientModal } from './components/PatientModal';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Koneksi WS ke Go backend (port 8080)
  const { patients } = useWebSocket('ws://localhost:8080/ws/patients');

  return (
    <div className="flex h-screen bg-medical-dark overflow-hidden font-sans">
      
      {/* Sidebar - Minimalist */}
      <aside className="w-64 bg-medical-panel border-r border-medical-accent-dark/50 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-medical-accent-dark/50">
          <div className="flex items-center gap-3 text-medical-accent">
            <ShieldAlert className="w-7 h-7" />
            <span className="text-xl font-black tracking-widest text-medical-accent-light">AGHA<span className="text-medical-accent">TRIAGE</span></span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-medical-accent/10 text-medical-accent rounded-xl font-medium transition-colors">
            <Activity className="w-5 h-5" />
            Live Dashboard
          </button>
          {/* Menu items dimock untuk UI saja */}
          <button className="w-full flex items-center gap-3 px-4 py-3 text-medical-accent hover:text-medical-accent-light hover:bg-slate-800 rounded-xl font-medium transition-colors">
            <Menu className="w-5 h-5" />
            Riwayat Medis
          </button>
        </nav>
        <div className="p-4">
          <div className="bg-medical-panel p-4 rounded-xl border border-medical-accent-dark/30/50">
            <div className="text-xs text-medical-accent mb-1 uppercase font-bold tracking-wider">Status Server</div>
            <div className="flex items-center gap-2 text-medical-accent font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-medical-accent animate-pulse"></span>
              Koneksi Stabil
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-medical-panel/50 backdrop-blur-md border-b border-medical-accent-dark/50 flex items-center justify-between px-6 z-10 hidden md:flex">
          <div className="flex bg-medical-panel border border-medical-accent-dark/30 rounded-full px-4 py-2 items-center w-96 focus-within:border-emerald-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-500 mr-2" />
            <input 
              type="text" 
              placeholder="Cari NIK / Nama Pasien..." 
              className="bg-transparent border-none outline-none text-sm text-medical-accent-light w-full placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-medical-accent hover:text-medical-accent-light transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-triage-red-text rounded-full border border-medical-panel"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-medical-accent-dark to-medical-accent border-2 border-medical-panel shadow-sm shadow-medical-accent-dark/20"></div>
          </div>
        </header>

        {/* Dashboard Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header Text */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-medical-accent-light mb-2">Instalasi Gawat Darurat</h1>
              <p className="text-medical-accent">Pemantauan triase pasien real-time via WhatsApp yang ditenagai oleh Gemini AI.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-medical-panel border border-medical-accent-dark/50 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-medical-accent text-sm font-semibold uppercase tracking-wider mb-1">Total Masuk</p>
                  <p className="text-3xl font-black text-medical-accent-light">{patients.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-medical-accent">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-triage-red-bg/20 border border-triage-red-border/30 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-triage-red-text text-sm font-semibold uppercase tracking-wider mb-1">Gawat Darurat</p>
                  <p className="text-3xl font-black text-triage-red-text">{patients.filter(p => p.triage === 'MERAH').length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-triage-red-bg flex items-center justify-center text-triage-red-text">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-triage-yellow-bg/20 border border-triage-yellow-border/30 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-triage-yellow-text text-sm font-semibold uppercase tracking-wider mb-1">Darurat Tidak Gawat</p>
                  <p className="text-3xl font-black text-triage-yellow-text">{patients.filter(p => p.triage === 'KUNING').length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-triage-yellow-bg flex items-center justify-center text-triage-yellow-text">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-medical-accent-light">Antrean Streaming</h2>
                <div className="flex items-center gap-2 text-sm text-medical-accent bg-medical-panel px-3 py-1.5 rounded-full border border-medical-accent-dark/30/50">
                  <span className="w-2 h-2 rounded-full bg-medical-accent animate-pulse"></span>
                  Live View
                </div>
              </div>
              <PatientTable patients={patients} onSelectPatient={setSelectedPatient} />
            </div>

          </div>
        </div>
      </main>

      {/* Modal */}
      {selectedPatient && (
        <PatientModal 
          patient={selectedPatient} 
          onClose={() => setSelectedPatient(null)} 
        />
      )}

    </div>
  );
}

export default App;
