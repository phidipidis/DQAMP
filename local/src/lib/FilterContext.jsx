import { createContext, useContext, useState, useCallback } from 'react';
import { useFiscalYear, yearOf, runsInYear } from '@/lib/fiscalYear';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const fiscalYear = useFiscalYear();
  // null = follow the fiscal year from System Settings; 'All' = every year.
  const [yearChoice, setYear] = useState(null);
  const year = yearChoice ?? fiscalYear;
  const [quarters, setQuarters] = useState([]);   // [] = All
  const [divisions, setDivisions] = useState([]); // [] = All

  const toggleQuarter = useCallback((q) => {
    setQuarters(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]);
  }, []);

  const toggleDivision = useCallback((d) => {
    setDivisions(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }, []);

  const clearFilters = useCallback(() => {
    setYear(null);
    setQuarters([]);
    setDivisions([]);
  }, []);

  // True when the user has narrowed anything beyond the default year.
  const hasActiveFilters = quarters.length > 0 || divisions.length > 0 || year !== fiscalYear;

  /**
   * Returns true if the activity/project matches the active global filters.
   * dateField: the ISO date string field used to derive the year and quarter.
   * divisionField: the string field for division.
   * A project (dateField 'Project_Start_Date') counts in every year it runs.
   * Any other record with no date is counted in the year it was entered (created_date);
   * the quarter filter still leaves out records with no date.
   */
  const matchesFilters = useCallback((item, dateField = null, divisionField = 'Functional_Division') => {
    if (divisions.length > 0 && !divisions.includes(item[divisionField])) return false;
    // Use explicit dateField if provided, otherwise fall back through common date fields
    const dateStr = dateField
      ? item[dateField]
      : (item['Start_Date'] || item['Planned_Start_Date'] || item['Date_Conducted']);
    if (dateField === 'Project_Start_Date') {
      if (!runsInYear(item, year)) return false;
    } else if (year !== 'All') {
      const itemYear = yearOf(dateStr || item.created_date);
      if (itemYear !== null && itemYear !== year) return false;
    }
    if (quarters.length > 0) {
      if (!dateStr) return false;
      const month = new Date(dateStr).getMonth();
      const q = `Q${Math.floor(month / 3) + 1}`;
      if (!quarters.includes(q)) return false;
    }
    return true;
  }, [year, quarters, divisions]);

  return (
    <FilterContext.Provider value={{
      year, setYear, fiscalYear, quarters, divisions, toggleQuarter, toggleDivision,
      clearFilters, hasActiveFilters, matchesFilters, setQuarters, setDivisions,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
