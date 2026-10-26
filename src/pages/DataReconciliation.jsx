import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, SectionHead, DashboardTable, AlertRow } from '@/components/ui/DashboardSystem';
import { GitCompare, CheckCircle, AlertTriangle, Database } from 'lucide-react';

export default function DataReconciliation() {
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: outputs = [] } = useQuery({ queryKey: ['outputs'], queryFn: () => base44.entities.ProjectOutputs.list() });
  const { data: goals = [] } = useQuery({ queryKey: ['orgGoals'], queryFn: () => base44.entities.OrganizationalGoal.list() });

  // Legacy field pairs that should have been migrated to canonical names
  const checks = [
    { entity: 'DQAMPActivity', legacy: 'Title', canonical: 'Activity_Title', test: (a) => !!a.Title && !a.Activity_Title },
    { entity: 'DQAMPActivity', legacy: 'Category', canonical: 'Activity_Type', test: (a) => !!a.Category && !a.Activity_Type },
    { entity: 'DQAMPActivity', legacy: 'Schedule_Start_Date', canonical: 'Planned_Start_Date', test: (a) => !!a.Schedule_Start_Date && !a.Planned_Start_Date },
    { entity: 'DQAMPActivity', legacy: 'Schedule_End_Date', canonical: 'Planned_Completion_Date', test: (a) => !!a.Schedule_End_Date && !a.Planned_Completion_Date },
    { entity: 'Project', legacy: 'Budget', canonical: 'Financial_Allocation', test: (p) => (p.Budget != null && p.Budget !== 0) && p.Financial_Allocation == null },
    { entity: 'Project', legacy: 'Actual_Cost', canonical: 'Financial_Utilization', test: (p) => (p.Actual_Cost != null && p.Actual_Cost !== 0) && p.Financial_Utilization == null },
    { entity: 'ProjectOutputs', legacy: 'Output_Category', canonical: 'Output_Type', test: (o) => !!o.Output_Category && !o.Output_Type },
    { entity: 'ProjectOutputs', legacy: 'Due_Date', canonical: 'Target_Date', test: (o) => !!o.Due_Date && !o.Target_Date },
    { entity: 'OrganizationalGoal', legacy: 'Title', canonical: 'Goal_Title', test: (g) => !!g.Title && !g.Goal_Title },
    { entity: 'OrganizationalGoal', legacy: 'Priority_Level', canonical: 'Strategic_Priority', test: (g) => !!g.Priority_Level && !g.Strategic_Priority },
  ];

  const sources = { DQAMPActivity: activities, Project: projects, ProjectOutputs: outputs, OrganizationalGoal: goals };
  const results = checks.map(c => {
    const records = sources[c.entity] || [];
    const discrepancies = records.filter(c.test);
    return { ...c, total: records.length, discrepancyCount: discrepancies.length, migrated: records.length - discrepancies.length, sample: discrepancies.slice(0, 5).map(r => r.id) };
  });

  const totalDiscrepancies = results.reduce((s, r) => s + r.discrepancyCount, 0);
  const totalMigrated = results.reduce((s, r) => s + r.migrated, 0);
  const migrationRate = (totalMigrated + totalDiscrepancies) > 0 ? Math.round((totalMigrated / (totalMigrated + totalDiscrepancies)) * 100) : 100;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Data Reconciliation" subtitle="Legacy data migration status and remaining field-name discrepancies" />
      <KPIBand>
        <KPITile label="Migration rate" value={`${migrationRate}%`} icon={CheckCircle} borderLeft={C.successBar} />
        <KPITile label="Records migrated" value={totalMigrated} icon={Database} borderLeft={C.brand} />
        <KPITile label="Discrepancies" value={totalDiscrepancies} icon={AlertTriangle} borderLeft={C.danger} />
        <KPITile label="Fields checked" value={checks.length} icon={GitCompare} borderLeft={C.warningBar} />
      </KPIBand>

      <Panel>
        <SectionHead>Migration status</SectionHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {totalDiscrepancies === 0 && <AlertRow icon={CheckCircle} severity="success" text="All records fully migrated to canonical field names" />}
          {totalDiscrepancies > 0 && totalDiscrepancies < 10 && <AlertRow icon={AlertTriangle} severity="warning" text={`${totalDiscrepancies} records still use legacy field names — review below`} />}
          {totalDiscrepancies >= 10 && <AlertRow icon={AlertTriangle} severity="danger" text={`${totalDiscrepancies} records still use legacy field names — migration incomplete`} />}
        </div>
      </Panel>

      <DashboardPanel title="Field reconciliation status" aside="legacy → canonical" noPad>
        <DashboardTable
          headers={[{ label: 'Entity' }, { label: 'Legacy field' }, { label: 'Canonical field' }, { label: 'Records', align: 'right' }, { label: 'Migrated', align: 'right' }, { label: 'Discrepancies', align: 'right' }, { label: 'Status' }]}
          rows={results}
          emptyMessage="No checks defined."
          renderRow={(r, i) => (
            <tr key={r.entity + r.legacy} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{r.entity}</td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{r.legacy}</td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.brand, fontFamily: 'monospace' }}>{r.canonical}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted, textAlign: 'right' }}>{r.total}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.success, textAlign: 'right' }}>{r.migrated}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: r.discrepancyCount > 0 ? C.danger : C.muted, textAlign: 'right' }}>{r.discrepancyCount}</td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5, background: r.discrepancyCount === 0 ? C.successSoft : C.dangerSoft, color: r.discrepancyCount === 0 ? C.success : C.danger }}>
                  {r.discrepancyCount === 0 ? 'Complete' : 'Pending'}
                </span>
              </td>
            </tr>
          )}
        />
      </DashboardPanel>
    </div>
  );
}