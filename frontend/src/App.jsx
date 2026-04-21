import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, Menu, Bell, ShieldAlert, X } from 'lucide-react';
import { PatientTable } from './components/PatientTable';
import { PatientModal } from './components/PatientModal';
import { ConnectionBadge } from './components/ConnectionBadge';
import { AlertBanner } from './components/AlertBanner';
import { FilterBar } from './components/FilterBar';
import { SearchBar } from './components/SearchBar';
import { StatsCards } from './components/StatsCards';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [triageFilter, setTriageFilter]       = useState('ALL');
  const [urgentPatient, setUrgentPatient]     = useState(null);
  const [sidebarOpen, setSidebarOpen]         = useState(false);
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
          p.symptoms?.toLowerCase().includes(q)
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
    <div className="flex h-screen bg-medical-dark overflow-hidden font-sans relative">

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`w-64 bg-medical-panel border-r border-medical-accent-dark/50 flex flex-col fixed md:relative z-50 h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-medical-accent-dark/50">
          <div className="flex items-center gap-3 text-medical-accent">
            <ShieldAlert className="w-7 h-7" />
            <span className="text-xl font-black tracking-widest text-medical-accent-light">
              AGHA<span className="text-medical-accent">TRIAGE</span>
            </span>
          </div>
          <button className="md:hidden text-medical-accent" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-medical-panel/50 backdrop-blur-md border-b border-medical-accent-dark/50 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setSidebarOpen(true)} className="text-medical-accent hover:text-medical-accent-light">
              <Menu className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 md:max-w-md mx-4 md:ml-0">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button className="relative p-2 text-medical-accent hover:text-medical-accent-light transition-colors">
              <Bell className="w-5 h-5" />
              {hasMerahUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-triage-red-text rounded-full border border-medical-panel animate-pulse" />
              )}
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-medical-accent-dark to-medical-accent border-2 border-medical-panel shadow-sm shadow-medical-accent-dark/20 text-xs flex items-center justify-center font-bold text-medical-dark">
              AD
            </div>
          </div>
        </header>

        {/* Dashboard Area */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            
            {/* Header Text */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-medical-accent-light mb-1 sm:mb-2">
                  Instalasi Gawat Darurat
                </h1>
                <p className="text-medical-accent text-sm sm:text-base">
                  Pemantauan triase pasien real-time via WhatsApp.
                </p>
              </div>
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
            <StatsCards stats={stats} />

            {/* Table Section */}
            <div className="bg-medical-dark flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-medical-accent-light">Antrean Streaming</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <FilterBar activeFilter={triageFilter} onChange={setTriageFilter} />
                  <div className="hidden sm:flex items-center gap-2 text-sm text-medical-accent bg-medical-panel px-3 py-1.5 rounded-full border border-medical-accent-dark/30 whitespace-nowrap">
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
