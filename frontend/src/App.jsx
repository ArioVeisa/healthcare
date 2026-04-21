import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, Menu, Bell, Search, ShieldAlert } from 'lucide-react';
import { PatientTable } from './components/PatientTable';
import { PatientModal } from './components/PatientModal';
import { ConnectionBadge } from './components/ConnectionBadge';
import { AlertBanner } from './components/AlertBanner';
import { FilterBar } from './components/FilterBar';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [triageFilter, setTriageFilter]       = useState('ALL');
  const [urgentPatient, setUrgentPatient]     = useState(null);
  const prevCountRef = useRef(0);

  const { patients, loading, error, connectionStatus } = useWebSocket();

  // ─── Detect MERAH baru masuk ────────────────────────────────────────────
  useEffect(() => {
    if (patients.length > prevCountRef.current) {
      const newest = patients[0];
      if (newest?.triage === 'MERAH') {
        setUrgentPatient(newest);
      }
    }
    prevCountRef.current = patients.length;
  }, [patients]);

  // ─── Filtered + searched patients ──────────────────────────────────────
  const displayPatients = useMemo(() => {
    let result = patients;
    if (triageFilter !== 'ALL') {
      result = result.filter((p) => p.triage === triageFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q) ||
          p.symptoms?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [patients, triageFilter, searchQuery]);

  // ─── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:  patients.length,
    merah:  patients.filter((p) => p.triage === 'MERAH').length,
    kuning: patients.filter((p) => p.triage === 'KUNING').length,
    hijau:  patients.filter((p) => p.triage === 'HIJAU').length,
  }), [patients]);

  const hasMerahUnread = stats.merah > 0;

  return (
    <div className="flex h-screen bg-medical-dark overflow-hidden font-sans">

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-medical-panel border-r border-medical-accent-dark/50 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-medical-accent-dark/50">
          <div className="flex items-center gap-3 text-medical-accent">
            <ShieldAlert className="w-7 h-7" />
            <span className="text-xl font-black tracking-widest text-medical-accent-light">
              AGHA<span className="text-medical-accent">TRIAGE</span>
            </span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-medical-accent/10 text-medical-accent rounded-xl font-medium transition-colors">
            <Activity className="w-5 h-5" />
            Live Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-medical-accent hover:text-medical-accent-light hover:bg-slate-800 rounded-xl font-medium transition-colors">
            <Menu className="w-5 h-5" />
            Riwayat Medis
          </button>
        </nav>
        <div className="p-4">
          <ConnectionBadge status={connectionStatus} />
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className="h-16 bg-medical-panel/50 backdrop-blur-md border-b border-medical-accent-dark/50 flex items-center justify-between px-6 z-10 hidden md:flex">
          <div className="flex bg-medical-panel border border-medical-accent-dark/30 rounded-full px-4 py-2 items-center w-96 focus-within:border-emerald-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
            <input
              id="search-input"
              type="text"
              placeholder="Cari nama / no. HP / keluhan..."
              className="bg-transparent border-none outline-none text-sm text-medical-accent-light w-full placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-medical-accent hover:text-medical-accent-light transition-colors">
              <Bell className="w-5 h-5" />
              {hasMerahUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-triage-red-text rounded-full border border-medical-panel animate-pulse" />
              )}
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-medical-accent-dark to-medical-accent border-2 border-medical-panel shadow-sm shadow-medical-accent-dark/20" />
          </div>
        </header>

        {/* Dashboard Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Header Text */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-medical-accent-light mb-2">
                Instalasi Gawat Darurat
              </h1>
              <p className="text-medical-accent">
                Pemantauan triase pasien real-time via WhatsApp yang ditenagai oleh Gemini AI.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-red-900/20 border border-red-700/40 text-red-400 text-sm">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Urgent Alert */}
            {urgentPatient && (
              <AlertBanner
                patient={urgentPatient}
                onDismiss={() => setUrgentPatient(null)}
              />
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-medical-panel border border-medical-accent-dark/50 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-medical-accent text-xs font-semibold uppercase tracking-wider mb-1">Total Masuk</p>
                  <p className="text-3xl font-black text-medical-accent-light">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-medical-accent">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-triage-red-bg/20 border border-triage-red-border/30 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-triage-red-text text-xs font-semibold uppercase tracking-wider mb-1">Gawat Darurat</p>
                  <p className="text-3xl font-black text-triage-red-text">{stats.merah}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-triage-red-bg flex items-center justify-center text-triage-red-text">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-triage-yellow-bg/20 border border-triage-yellow-border/30 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-triage-yellow-text text-xs font-semibold uppercase tracking-wider mb-1">Darurat Tidak Gawat</p>
                  <p className="text-3xl font-black text-triage-yellow-text">{stats.kuning}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-triage-yellow-bg flex items-center justify-center text-triage-yellow-text">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-triage-green-bg/20 border border-triage-green-border/30 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-triage-green-text text-xs font-semibold uppercase tracking-wider mb-1">Tidak Gawat</p>
                  <p className="text-3xl font-black text-triage-green-text">{stats.hijau}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-triage-green-bg flex items-center justify-center text-triage-green-text">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-medical-accent-light">Antrean Streaming</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <FilterBar activeFilter={triageFilter} onChange={setTriageFilter} />
                  <div className="flex items-center gap-2 text-sm text-medical-accent bg-medical-panel px-3 py-1.5 rounded-full border border-medical-accent-dark/30">
                    <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    Live View
                  </div>
                </div>
              </div>
              <PatientTable
                patients={displayPatients}
                loading={loading}
                onSelectPatient={setSelectedPatient}
              />
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
