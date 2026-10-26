import React from 'react';

// ── Design tokens ─────────────────────────────────────────────────────────────
export const C = {
  brand:       '#1B2A8F',
  accent:      '#1D4ED8',
  accentSoft:  '#EAF0FF',
  success:     '#166534',
  successSoft: '#F0FDF4',
  successBar:  '#22C55E',
  warning:     '#92400E',
  warningSoft: '#FFFBEB',
  warningBar:  '#F59E0B',
  danger:      '#991B1B',
  dangerSoft:  '#FEF2F2',
  dangerBar:   '#EF4444',
  neutral:     '#374151',
  neutralSoft: '#F8FAFC',
  muted:       '#4B5563',
  border:      '#E5E9F0',
  surface:     '#FFFFFF',
  bg:          '#F7F9FC',
  text:        '#0F172A',
};

export const FONT = "'Public Sans', system-ui, sans-serif";
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
export const DIVISIONS = ['CID', 'SGOD', 'OSDS'];

const fontFam = { fontFamily: FONT };

// ── Page header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ ...fontFam, fontSize: 32, fontWeight: 700, color: C.brand, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.15 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ ...fontFam, fontSize: 15, fontWeight: 400, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

// ── Section heading — 16px/600 ────────────────────────────────────────────────
export function SectionHead({ children, aside = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
      <span style={{ ...fontFam, fontSize: 16, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
        {children}
      </span>
      {aside && (
        <span style={{ ...fontFam, fontSize: 12, fontWeight: 400, color: C.muted, whiteSpace: 'nowrap' }}>
          {aside}
        </span>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function Panel({ children, style = {}, padded = true }) {
  return (
    <div style={{
      ...fontFam,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: padded ? '22px 24px' : 0,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Panel with header ─────────────────────────────────────────────────────────
export function DashboardPanel({ title, aside = null, children, noPad = false }) {
  return (
    <Panel padded={false} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: title ? `1px solid ${C.border}` : 'none' }}>
        {title && <SectionHead aside={aside}>{title}</SectionHead>}
      </div>
      <div style={{ padding: noPad ? 0 : '0 24px 22px' }}>
        {children}
      </div>
    </Panel>
  );
}

// ── Filter label — 12px/600 uppercase ─────────────────────────────────────────
export function FilterLabel({ children }) {
  return (
    <span style={{ ...fontFam, fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, flexShrink: 0 }}>
      {children}
    </span>
  );
}

// ── Segmented control button ──────────────────────────────────────────────────
export function SegBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="min-h-[44px] lg:min-h-0"
      style={{
        ...fontFam,
        padding: '6px 14px',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? C.surface : C.neutral,
        background: active ? C.brand : 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        boxShadow: active ? '0 1px 2px rgba(11,46,169,0.18)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

// ── Segmented control group ───────────────────────────────────────────────────
// ── Segmented filter (label + control, single or multi) ───────────────────────
export function SegmentedFilter({ label, options, selected, onToggle, multi = true, includeAll = false }) {
  const allOptions = includeAll ? ['All', ...options] : options;
  const isActive = (opt) => multi ? selected.includes(opt) : selected === opt;
  const handleClick = (opt) => {
    if (multi) {
      onToggle(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]);
    } else {
      onToggle(opt);
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {label && <FilterLabel>{label}</FilterLabel>}
      <div style={{ display: 'flex', background: C.bg, borderRadius: 8, padding: 3, gap: 2 }}>
        {allOptions.map(opt => (
          <SegBtn key={opt} label={opt} active={isActive(opt)} onClick={() => handleClick(opt)} />
        ))}
      </div>
    </div>
  );
}

// ── Filter toolbar ────────────────────────────────────────────────────────────
export function FilterToolbar({ children }) {
  return (
    <div style={{
      ...fontFam,
      display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '12px 20px',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}>
      {children}
    </div>
  );
}

export function FilterDivider() {
  return <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />;
}

// ── KPI tile ──────────────────────────────────────────────────────────────────
export function KPITile({ label, value, title, sub = null, icon: Icon = null, borderLeft = C.brand }) {
  return (
    <div style={{
      ...fontFam,
      flex: 1, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 6,
      minWidth: 0, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {Icon && <Icon size={13} color={borderLeft} strokeWidth={2} />}
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, lineHeight: 1.3 }}>
          {label}
        </span>
      </div>
      <span title={title} style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 12, fontWeight: 400, color: C.muted }}>{sub}</span>}
    </div>
  );
}

// ── KPI band ──────────────────────────────────────────────────────────────────
export function KPIBand({ children }) {
  const items = React.Children.toArray(children);
  return (
    // Two columns on phones, one row from 640px. The 1px gap shows the border colour.
    <div
      className="grid grid-cols-2 gap-px sm:flex"
      style={{ ...fontFam, background: C.border, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
    >
      {items.map((child, i) => (
        <div key={i} className="flex min-w-0 flex-1" style={{ background: C.surface }}>{child}</div>
      ))}
    </div>
  );
}

// ── Status segment ────────────────────────────────────────────────────────────
export function StatusSegment({ label, count, total, color, softBg = null }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ ...fontFam, flex: 1, padding: '16px 20px', background: softBg, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {count}
      </div>
      <div style={{ fontSize: 12, fontWeight: 400, color: C.muted, marginTop: 5 }}>
        {pct}% of total
      </div>
    </div>
  );
}

export function StatusStrip({ children }) {
  const items = React.Children.toArray(children);
  return (
    <div style={{ display: 'flex' }}>
      {items.map((child, i) => [
        child,
        i < items.length - 1 ? <div key={`div-${i}`} style={{ width: 1, background: C.border, flexShrink: 0 }} /> : null,
      ])}
    </div>
  );
}

// ── Alert row ─────────────────────────────────────────────────────────────────
export function AlertRow({ icon: Icon = null, text, severity = 'info' }) {
  const colors = {
    warning: { bg: C.warningSoft, accent: C.warningBar, text: C.warning },
    danger:  { bg: C.dangerSoft,  accent: C.dangerBar,  text: C.danger  },
    info:    { bg: C.accentSoft,  accent: C.accent,     text: C.brand   },
    success: { bg: C.successSoft, accent: C.successBar, text: C.success },
  }[severity] ?? { bg: C.neutralSoft, accent: C.muted, text: C.neutral };
  return (
    <div style={{
      ...fontFam,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 7,
      background: colors.bg, border: `1px solid ${colors.accent}22`,
    }}>
      {Icon && <Icon size={14} color={colors.accent} />}
      <span style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{text}</span>
    </div>
  );
}

// ── Table helpers ─────────────────────────────────────────────────────────────
export function DashboardTable({ headers, rows, emptyMessage = null, renderRow }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ ...fontFam, width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '10px 16px',
                textAlign: h.align === 'right' ? 'right' : 'left',
                fontSize: 12, fontWeight: 600, color: C.muted,
                whiteSpace: 'nowrap', letterSpacing: '0.02em',
              }}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, fontWeight: 400, color: C.muted }}>
                {emptyMessage || 'No data available.'}
              </td>
            </tr>
          ) : rows.map((row, i) => renderRow(row, i))}
        </tbody>
      </table>
    </div>
  );
}

// ── Clear filters button ──────────────────────────────────────────────────────
export function ClearFiltersButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ ...fontFam, fontSize: 12, fontWeight: 500, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
    >
      Clear filters
    </button>
  );
}

// ── Chart wrapper ─────────────────────────────────────────────────────────────
export const chartTickStyle = { fontSize: 13, fill: C.muted, fontFamily: FONT };
export const chartTickSmall = { fontSize: 12, fill: C.muted, fontFamily: FONT };
export const chartTooltipStyle = { border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: FONT };
export const chartGridStroke = C.border;