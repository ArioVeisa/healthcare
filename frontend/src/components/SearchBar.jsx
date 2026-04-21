import React from 'react';
import { Search } from 'lucide-react';

export function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="flex bg-medical-panel border border-medical-accent-dark/30 rounded-full px-4 py-2 items-center w-full focus-within:border-emerald-500/50 transition-colors">
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
  );
}
