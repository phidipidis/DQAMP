import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, SectionHead, DashboardTable, AlertRow } from '@/components/ui/DashboardSystem';
import { Database, Users, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

export default function SystemHealth() {
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: outputs = [] } = useQuery({ queryKey: ['outputs'], queryFn: () => base44.entities.ProjectOutputs.list() });
  const { data: objectives = [] } = useQuery({ queryKey: ['divObjectives'], queryFn: () => base44.entities.DivisionObjective.list() });
  const { data: goals = [] } = useQuery({ queryKey: ['orgGoals'], queryFn: () => base44.entities.OrganizationalGoal.list() });
  const { data: feedback = [] } = useQuery({ queryKey: ['artaFeedback'], queryFn: () => base44.entities.ARTAFeedback.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });
  const { data: auditLogs = [] } = useQuery({ queryKey: ['auditLogsHealth'], queryFn: () => base44.entities.Audit_Log.list('-Timestamp', 50) });

  const entityCounts = [
    { label: 'Activities', count: activities.length },
    { label: 'Projects', count: projects.length },
    { label: 'Outputs', count: outputs.length },
    { label: 'Division Objectives', count: objectives.length },
    { label: 'Organizational Goals', count: goals.length },
    { label: 'ARTA Feedback', count: feedback.length },
  ];
  const totalRecords = entityCounts.reduce((s, e) => s + e.count, 0);

  const actsMissingTitle = activities.filter(a => !a.Activity_Title && !a.Title).length;
  const actsMissingCode = activities.filter(a => !a.Activity_ID).length;
  const actsMissingDivision = activities.filter(a => !a.Functional_Division).length;
  const integrityIssues = actsMissingTitle + actsMissingCode + actsMissingDivision;
  const integrityScore = totalRecords > 0 ? Math.max(0, Math.round((1 - integrityIssues / totalRecords) * 100)) : 100;

  const recentEvents = auditLogs.slice(0, 12);

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="System Health" subtitle="Database integrity, system events, and active user overview" />
      <KPIBand>
        <KPITile label="Total records" value={totalRecords} icon={Database} borderLeft={C.brand} />
        <KPITile label="Active users" value={users.length} icon={Users} borderLeft={C.accent} />
        <KPITile label="Integrity score" value={`${integrityScore}%`} icon={CheckCircle} borderLeft={C.successBar} sub={`${integrityIssues} field issues`} />
        <KPITile label="Recent events" value={auditLogs.length} icon={Activity} borderLeft={C.warningBar} sub="last 50 logged" />
      </KPIBand>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <DashboardPanel title="Entity record counts" noPad>
          <DashboardTable
            headers={[{ label: 'Entity' }, { label: 'Records', align: 'right' }]}
            rows={entityCounts}
            renderRow={(e, i) => (
              <tr key={e.label} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text }}>{e.label}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.brand, textAlign: 'right' }}>{e.count}</td>
              </tr>
            )}
          />
        </DashboardPanel>

        <Panel>
          <SectionHead>Data integrity flags</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actsMissingTitle > 0 && <AlertRow icon={AlertTriangle} severity="warning" text={`${actsMissingTitle} activities missing a title`} />}
            {actsMissingCode > 0 && <AlertRow icon={AlertTriangle} severity="warning" text={`${actsMissingCode} activities missing an Activity ID`} />}
            {actsMissingDivision > 0 && <AlertRow icon={AlertTriangle} severity="danger" text={`${actsMissingDivision} activities missing a division`} />}
            {integrityIssues === 0 && <AlertRow icon={CheckCircle} severity="success" text="No data integrity issues detected" />}
          </div>
        </Panel>
      </div>

      <DashboardPanel title="Recent system events" aside="audit log" noPad>
        <DashboardTable
          headers={[{ label: 'Timestamp' }, { label: 'Action' }, { label: 'Entity' }, { label: 'User' }, { label: 'Remarks' }]}
          rows={recentEvents}
          emptyMessage="No recent events."
          renderRow={(l, i) => (
            <tr key={l.id || i} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{l.Timestamp ? new Date(l.Timestamp).toLocaleString() : '—'}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{l.Action_Type}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, color: C.muted }}>{l.Entity}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, color: C.muted }}>{l.User_Email || '—'}</td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.Remarks || '—'}</td>
            </tr>
          )}
        />
      </DashboardPanel>
    </div>
  );
}