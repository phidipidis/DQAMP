import { useFilters } from '@/lib/FilterContext';
import { yearOptions } from '@/lib/fiscalYear';
import { C, FONT, QUARTERS, DIVISIONS, SegBtn, FilterLabel, FilterDivider, ClearFiltersButton, YearFilter } from './DashboardSystem';

export default function GlobalFilterBar() {
  const { year, setYear, fiscalYear, quarters, divisions, toggleQuarter, toggleDivision, clearFilters, hasActiveFilters: hasActive } = useFilters();
  const summary = [...(year !== fiscalYear ? [year === 'All' ? 'All years' : String(year)] : []), ...quarters, ...divisions];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      padding: '8px 32px',
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      fontFamily: FONT,
    }}>

      <YearFilter value={year} onChange={setYear} years={yearOptions(fiscalYear)} />

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

      {/* Active filter summary + clear */}
      {hasActive && (
        <>
          <FilterDivider />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: C.brand, fontWeight: 600 }}>
              {summary.join(' · ')}
            </span>
            <ClearFiltersButton onClick={clearFilters} />
          </div>
        </>
      )}
    </div>
  );
}