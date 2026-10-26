import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, DIVISIONS, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, DashboardTable, SegmentedFilter } from '@/components/ui/DashboardSystem';
import { ClipboardCheck, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const evaluate = (a) => {
  const checks = {
    hasID: !!a.Activity_ID,
    hasTitle: !!a.Activity_Title,
    hasDivision: !!a.Functional_Division,
    hasEvidence: (a.Evidence_Attachments?.length || 0) > 0,
    hasQAME: a.needs_qame_eval_form === false || !!a.QAME_Rating,
    hasARTA: a.ARTA_CSM_Submitted === true,
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { ...checks, score: Math.round((passed / total) * 100), passed, total };
};

const statusBadge = (score) => {
  if (score === 100) return { label: 'Compliant', color: C.success, bg: C.successSoft, Icon: CheckCircle };
  if (score >= 50) return { label: 'Partial', color: C.warningBar, bg: C.warningSoft, Icon: AlertTriangle };
  return { label: 'Non-compliant', color: C.danger, bg: C.dangerSoft, Icon: XCircle };
};

export default function ComplianceTracker() {
  const [filterDiv, setFilterDiv] = useState('All');
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });

  const evaluated = activities.map(a => ({ ...evaluate(a), activity: a }));
  const filtered = filterDiv === 'All' ? evaluated : evaluated.filter(e => e.activity.Functional_Division === filterDiv);

  const byUnit = {};
  filtered.forEach(e => {
    const div = e.activity.Functional_Division || 'Unassigned';
    const unit = e.activity.Operating_Unit || e.activity.Unit_Section || 'General';
    const key = `${div}|${unit}`;
    if (!byUnit[key]) byUnit[key] = { division: div, unit, items: [] };
    byUnit[key].items.push(e);
  });
  const unitRows = Object.values(byUnit).map(g => {
    const avg = g.items.length > 0 ? Math.round(g.items.reduce((s, i) => s + i.score, 0) / g.items.length) : 0;
    return { ...g, avg, total: g.items.length, compliant: g.items.filter(i => i.score === 100).length, partial: g.items.filter(i => i.score >= 50 && i.score < 100).length, nonCompliant: g.items.filter(i => i.score < 50).length };
  }).sort((a, b) => a.division.localeCompare(b.division));

  const overallAvg = filtered.length > 0 ? Math.round(filtered.reduce((s, e) => s + e.score, 0) / filtered.length) : 0;
  const totalCompliant = filtered.filter(e => e.score === 100).length;
  const totalPartial = filtered.filter(e => e.score >= 50 && e.score < 100).length;
  const totalNonCompliant = filtered.filter(e => e.score < 50).length;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Compliance Tracker" subtitle="Real-time adherence status by functional division and operating unit" />
      <KPIBand>
        <KPITile label="Avg compliance" value={`${overallAvg}%`} icon={ClipboardCheck} borderLeft={C.brand} />
        <KPITile label="Compliant" value={totalCompliant} icon={CheckCircle} borderLeft={C.successBar} />
        <KPITile label="Partial" value={totalPartial} icon={AlertTriangle} borderLeft={C.warningBar} />
        <KPITile label="Non-compliant" value={totalNonCompliant} icon={XCircle} borderLeft={C.danger} />
      </KPIBand>

      <Panel>
        <SegmentedFilter label="Division" options={DIVISIONS} selected={filterDiv} onToggle={setFilterDiv} multi={false} includeAll />
      </Panel>

      <DashboardPanel title="Operating unit compliance" aside={`${unitRows.length} units`} noPad>
        <DashboardTable
          headers={[{ label: 'Division' }, { label: 'Operating unit' }, { label: 'Activities', align: 'right' }, { label: 'Compliant', align: 'right' }, { label: 'Partial', align: 'right' }, { label: 'Non-compliant', align: 'right' }, { label: 'Avg score', align: 'right' }]}
          rows={unitRows}
          emptyMessage="No activities found."
          renderRow={(r, i) => {
            const s = statusBadge(r.avg);
            return (
              <tr key={r.division + r.unit} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.brand }}>{r.division}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>{r.unit}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted, textAlign: 'right' }}>{r.total}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.success, textAlign: 'right' }}>{r.compliant}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.warningBar, textAlign: 'right' }}>{r.partial}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.danger, textAlign: 'right' }}>{r.nonCompliant}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 5, background: s.bg, color: s.color }}><s.Icon size={12} /> {r.avg}%</span>
                </td>
              </tr>
            );
          }}
        />
      </DashboardPanel>
    </div>
  );
}