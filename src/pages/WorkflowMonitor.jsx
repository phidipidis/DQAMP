import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, SectionHead, DashboardTable, AlertRow } from '@/components/ui/DashboardSystem';
import { Workflow, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const STAGES = ['Draft', 'Submitted', 'Under Review', 'Returned for Revision', 'Published'];

const stageColor = {
  'Draft': C.muted,
  'Submitted': C.accent,
  'Under Review': C.warningBar,
  'Returned for Revision': C.danger,
  'Published': C.success,
};

export default function WorkflowMonitor() {
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });

  const stageCounts = STAGES.map(stage => ({
    stage,
    count: activities.filter(a => a.Workflow_Status === stage).length,
  }));
  const total = activities.length;

  const bottlenecks = activities.filter(a => a.Workflow_Status === 'Submitted' || a.Workflow_Status === 'Under Review');
  const returned = activities.filter(a => a.Workflow_Status === 'Returned for Revision');
  const published = activities.filter(a => a.Workflow_Status === 'Published');

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Workflow Status Monitor" subtitle="Track activity workflow stages and identify bottlenecks" />
      <KPIBand>
        <KPITile label="Total activities" value={total} icon={Workflow} borderLeft={C.brand} />
        <KPITile label="In review queue" value={bottlenecks.length} icon={Clock} borderLeft={C.warningBar} sub="submitted + under review" />
        <KPITile label="Returned" value={returned.length} icon={AlertTriangle} borderLeft={C.danger} />
        <KPITile label="Published" value={published.length} icon={CheckCircle} borderLeft={C.successBar} />
      </KPIBand>

      <Panel>
        <SectionHead aside={`${total} activities`}>Workflow stage distribution</SectionHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stageCounts.map(s => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            return (
              <div key={s.stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.stage}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: stageColor[s.stage] }}>{s.count} · {pct}%</span>
                </div>
                <div style={{ height: 8, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: stageColor[s.stage], borderRadius: 99, transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <DashboardPanel title="Bottlenecks — awaiting review" aside={`${bottlenecks.length} items`} noPad>
          <DashboardTable
            headers={[{ label: 'Activity' }, { label: 'Stage' }, { label: 'Submitted' }]}
            rows={bottlenecks}
            emptyMessage="No activities awaiting review."
            renderRow={(a, i) => (
              <tr key={a.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.Activity_Title || a.Title}</td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 12, fontWeight: 600, color: stageColor[a.Workflow_Status] || C.muted }}>{a.Workflow_Status}</span></td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{a.Reviewed_Date || '—'}</td>
              </tr>
            )}
          />
        </DashboardPanel>

        <Panel>
          <SectionHead>Alerts</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bottlenecks.length > 0 && <AlertRow icon={Clock} severity="warning" text={`${bottlenecks.length} activities awaiting review`} />}
            {returned.length > 0 && <AlertRow icon={AlertTriangle} severity="danger" text={`${returned.length} activities returned for revision`} />}
            {published.length > 0 && <AlertRow icon={CheckCircle} severity="success" text={`${published.length} activities published`} />}
            {bottlenecks.length === 0 && returned.length === 0 && published.length === 0 && (
              <AlertRow icon={CheckCircle} severity="info" text="No workflow activity to monitor" />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}