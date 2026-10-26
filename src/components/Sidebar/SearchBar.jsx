import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ placeholder = "Search...", onSearch }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="px-4 py-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FCFF00] transition-all"
        />
      </div>
    </div>
  );
}