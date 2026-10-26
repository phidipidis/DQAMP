import React from 'react';
import { C, FONT, QUARTERS, DIVISIONS, SegBtn, FilterLabel, FilterDivider, ClearFiltersButton } from './DashboardSystem';

/**
 * Premium dashboard filter control — replaces multicolored pills
 * with unified segmented controls. Preserves all filter logic.
 */
export default function DashboardFilters({
  year, setYear,
  quarters, setQuarters,
  divisions, setDivisions,
  projectId, setProjectId,
  projects = []
}) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const toggleQuarter = (q) => {
    setQuarters(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]);
  };

  const toggleDivision = (d) => {
    setDivisions(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const hasActiveFilters = quarters.length > 0 || divisions.length > 0 || year !== 'All' || projectId !== 'All';

  const clearAll = () => {
    setYear('All');
    setQuarters([]);
    setDivisions([]);
    setProjectId('All');
  };

  const selectStyle = {
    border: `1px solid ${C.border}`, borderRadius: 6,
    padding: '5px 10px', fontSize: 13, fontWeight: 500,
    color: C.neutral, background: C.surface,
    outline: 'none', cursor: 'pointer', fontFamily: FONT,
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 9, padding: '10px 18px', fontFamily: FONT,
    }}>
      {/* Year */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FilterLabel>Year</FilterLabel>
        <select
          value={year?.toString()}
          onChange={e => setYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
          style={selectStyle}
        >
          <option value="All">All years</option>
          {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
        </select>
      </div>

      <FilterDivider />

      {/* Quarter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FilterLabel>Quarter</FilterLabel>
        <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 3, gap: 2 }}>
          {QUARTERS.map(q => (
            <SegBtn key={q} label={q} active={quarters.includes(q)} onClick={() => toggleQuarter(q)} />
          ))}
        </div>
      </div>

      <FilterDivider />

      {/* Division */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FilterLabel>Division</FilterLabel>
        <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 3, gap: 2 }}>
          {DIVISIONS.map(d => (
            <SegBtn key={d} label={d} active={divisions.includes(d)} onClick={() => toggleDivision(d)} />
          ))}
        </div>
      </div>

      <FilterDivider />

      {/* Project */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FilterLabel>Project</FilterLabel>
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          style={{ ...selectStyle, maxWidth: 260 }}
        >
          <option value="All">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.Project_Code} – {p.Project_Title}</option>)}
        </select>
      </div>

      {hasActiveFilters && (
        <>
          <FilterDivider />
          <ClearFiltersButton onClick={clearAll} />
        </>
      )}
    </div>
  );
}