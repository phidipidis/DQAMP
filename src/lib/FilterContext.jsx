import React, { createContext, useContext, useState, useCallback } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [quarters, setQuarters] = useState([]);   // [] = All
  const [divisions, setDivisions] = useState([]); // [] = All

  const toggleQuarter = useCallback((q) => {
    setQuarters(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]);
  }, []);

  const toggleDivision = useCallback((d) => {
    setDivisions(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }, []);

  const clearFilters = useCallback(() => {
    setQuarters([]);
    setDivisions([]);
  }, []);

  /**
   * Returns true if the activity/project matches the active global filters.
   * dateField: the ISO date string field used to derive the quarter.
   * divisionField: the string field for division.
   */
  const matchesFilters = useCallback((item, dateField = null, divisionField = 'Functional_Division') => {
    if (divisions.length > 0 && !divisions.includes(item[divisionField])) return false;
    if (quarters.length > 0) {
      // Use explicit dateField if provided, otherwise fall back through common date fields
      const dateStr = dateField
        ? item[dateField]
        : (item['Start_Date'] || item['Planned_Start_Date'] || item['Date_Conducted']);
      if (!dateStr) return false;
      const month = new Date(dateStr).getMonth();
      const q = `Q${Math.floor(month / 3) + 1}`;
      if (!quarters.includes(q)) return false;
    }
    return true;
  }, [quarters, divisions]);

  return (
    <FilterContext.Provider value={{ quarters, divisions, toggleQuarter, toggleDivision, clearFilters, matchesFilters, setQuarters, setDivisions }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}