import React from 'react';
import { useFilters } from '@/lib/FilterContext';
import { C, FONT, QUARTERS, DIVISIONS, SegBtn, FilterLabel, FilterDivider, ClearFiltersButton } from './DashboardSystem';

export default function GlobalFilterBar() {
  const { quarters, divisions, toggleQuarter, toggleDivision, clearFilters } = useFilters();
  const hasActive = quarters.length > 0 || divisions.length > 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      padding: '8px 32px',
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      fontFamily: FONT,
    }}>

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

      {/* Active filter summary + clear */}
      {hasActive && (
        <>
          <FilterDivider />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: C.brand, fontWeight: 600 }}>
              {[...quarters, ...divisions].join(' · ')}
            </span>
            <ClearFiltersButton onClick={clearFilters} />
          </div>
        </>
      )}
    </div>
  );
}