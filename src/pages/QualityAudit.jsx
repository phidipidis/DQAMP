import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, DashboardTable } from '@/components/ui/DashboardSystem';
import { FileCheck, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const auditChecks = [
  { key: 'idFormat', label: 'Activity ID present', test: (a) => !!a.Activity_ID },
  { key: 'canonicalTitle', label: 'Canonical title', test: (a) => !!a.Activity_Title },
  { key: 'evidence', label: 'Evidence attached', test: (a) => (a.Evidence_Attachments?.length || 0) > 0 },
  { key: 'qameRated', label: 'QAME rated', test: (a) => !!a.QAME_Rating },
  { key: 'artaSubmitted', label: 'ARTA submitted', test: (a) => a.ARTA_CSM_Submitted === true },
  { key: 'reviewerSet', label: 'Reviewer assigned', test: (a) => !!a.Reviewed_By },
];

export default function QualityAudit() {
  const [filter, setFilter] = useState('all');
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });

  const completed = activities.filter(a => a.Status === 'Completed' || a.Workflow_Status === 'Published');
  const audited = completed.map(a => {
    const results = auditChecks.map(c => ({ ...c, pass: c.test(a) }));
    const passed = results.filter(r => r.pass).length;
    const score = Math.round((passed / results.length) * 100);
    return { activity: a, results, passed, total: results.length, score };
  });

  const filtered = filter === 'pass' ? audited.filter(a => a.score === 100)
    : filter === 'fail' ? audited.filter(a => a.score < 100)
    : audited;

  const passedCount = audited.filter(a => a.score === 100).length;
  const failedCount = audited.filter(a => a.score < 100).length;
  const avgScore = audited.length > 0 ? Math.round(audited.reduce((s, a) => s + a.score, 0) / audited.length) : 0;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Quality Audit" subtitle="Review completed activities for documentation and naming compliance" />
      <KPIBand>
        <KPITile label="Audited activities" value={audited.length} icon={FileCheck} borderLeft={C.brand} />
        <KPITile label="Avg audit score" value={`${avgScore}%`} icon={CheckCircle} borderLeft={C.successBar} />
        <KPITile label="Fully compliant" value={passedCount} icon={CheckCircle} borderLeft={C.accent} />
        <KPITile label="Needs attention" value={failedCount} icon={AlertTriangle} borderLeft={C.danger} />
      </KPIBand>

      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Filter</span>
          <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 3, gap: 2 }}>
            {[{ k: 'all', l: `All (${audited.length})` }, { k: 'pass', l: `Compliant (${passedCount})` }, { k: 'fail', l: `Needs attention (${failedCount})` }].map(o => (
              <button key={o.k} onClick={() => setFilter(o.k)} style={{ padding: '5px 14px', fontSize: 13, fontWeight: filter === o.k ? 600 : 500, color: filter === o.k ? C.surface : C.neutral, background: filter === o.k ? C.brand : 'transparent', border: 'none', borderRadius: 5, cursor: 'pointer' }}>{o.l}</button>
            ))}
          </div>
        </div>
      </Panel>

      <DashboardPanel title="Audit results" aside={`${filtered.length} activities`} noPad>
        <DashboardTable
          headers={[{ label: 'Activity' }, { label: 'Division' }, { label: 'Checks' }, { label: 'Score', align: 'right' }, { label: 'Status' }]}
          rows={filtered}
          emptyMessage="No activities match this filter."
          renderRow={(a, i) => (
            <tr key={a.activity.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: C.text, maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.activity.Activity_Title || a.activity.Title}</td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{a.activity.Functional_Division}</td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {a.results.map(r => (
                    <span key={r.key} title={r.label} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: r.pass ? C.successSoft : C.dangerSoft, color: r.pass ? C.success : C.danger, fontWeight: 600 }}>{r.pass ? '✓' : '✗'} {r.label}</span>
                  ))}
                </div>
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: a.score === 100 ? C.success : a.score >= 50 ? C.warningBar : C.danger, textAlign: 'right' }}>{a.score}%</td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5, background: a.score === 100 ? C.successSoft : C.dangerSoft, color: a.score === 100 ? C.success : C.danger, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {a.score === 100 ? <CheckCircle size={12} /> : <XCircle size={12} />} {a.score === 100 ? 'Compliant' : 'Non-compliant'}
                </span>
              </td>
            </tr>
          )}
        />
      </DashboardPanel>
    </div>
  );
}