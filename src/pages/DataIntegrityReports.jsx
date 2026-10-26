import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, SectionHead, DashboardTable, AlertRow } from '@/components/ui/DashboardSystem';
import { FileSearch, AlertTriangle, CheckCircle, Database } from 'lucide-react';

export default function DataIntegrityReports() {
  const [activeTab, setActiveTab] = useState('activities');
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: outputs = [] } = useQuery({ queryKey: ['outputs'], queryFn: () => base44.entities.ProjectOutputs.list() });

  const actChecks = [
    { field: 'Activity_ID', label: 'Activity ID', test: a => !a.Activity_ID },
    { field: 'Activity_Title', label: 'Title', test: a => !a.Activity_Title && !a.Title },
    { field: 'Functional_Division', label: 'Division', test: a => !a.Functional_Division },
    { field: 'Start_Date', label: 'Start date', test: a => !a.Start_Date && !a.Planned_Start_Date },
    { field: 'Financial_Allocation', label: 'Budget allocation', test: a => a.Financial_Allocation == null },
  ];
  const actIssues = activities.map(a => {
    const missing = actChecks.filter(c => c.test(a)).map(c => c.label);
    return { id: a.id, name: a.Activity_Title || a.Title || a.Activity_ID || a.id, division: a.Functional_Division, missing };
  }).filter(r => r.missing.length > 0);

  const projChecks = [
    { field: 'Project_Code', label: 'Project code', test: p => !p.Project_Code },
    { field: 'Project_Title', label: 'Title', test: p => !p.Project_Title },
    { field: 'Functional_Division', label: 'Division', test: p => !p.Functional_Division },
    { field: 'Project_Start_Date', label: 'Start date', test: p => !p.Project_Start_Date },
  ];
  const projIssues = projects.map(p => {
    const missing = projChecks.filter(c => c.test(p)).map(c => c.label);
    return { id: p.id, name: `${p.Project_Code || ''} ${p.Project_Title || ''}`.trim() || p.id, division: p.Functional_Division, missing };
  }).filter(r => r.missing.length > 0);

  const outChecks = [
    { field: 'Output_Title', label: 'Title', test: o => !o.Output_Title },
    { field: 'Linked_Project', label: 'Linked project', test: o => !o.Linked_Project },
    { field: 'Status', label: 'Status', test: o => !o.Status },
  ];
  const outIssues = outputs.map(o => {
    const missing = outChecks.filter(c => c.test(o)).map(c => c.label);
    return { id: o.id, name: o.Output_Title || o.id, division: '', missing };
  }).filter(r => r.missing.length > 0);

  const totalIssues = actIssues.length + projIssues.length + outIssues.length;
  const cleanRecords = (activities.length + projects.length + outputs.length) - totalIssues;

  const tabs = [
    { key: 'activities', label: `Activities (${actIssues.length})`, rows: actIssues },
    { key: 'projects', label: `Projects (${projIssues.length})`, rows: projIssues },
    { key: 'outputs', label: `Outputs (${outIssues.length})`, rows: outIssues },
  ];
  const active = tabs.find(t => t.key === activeTab);

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Data Integrity Reports" subtitle="Missing fields and mismatched records across entities" />
      <KPIBand>
        <KPITile label="Records scanned" value={activities.length + projects.length + outputs.length} icon={Database} borderLeft={C.brand} />
        <KPITile label="Records with issues" value={totalIssues} icon={AlertTriangle} borderLeft={C.danger} />
        <KPITile label="Clean records" value={cleanRecords} icon={CheckCircle} borderLeft={C.successBar} />
        <KPITile label="Fields checked" value={actChecks.length + projChecks.length + outChecks.length} icon={FileSearch} borderLeft={C.warningBar} />
      </KPIBand>

      <Panel>
        <SectionHead>Issue summary</SectionHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actIssues.length > 0 && <AlertRow icon={AlertTriangle} severity="warning" text={`${actIssues.length} activities with missing fields`} />}
          {projIssues.length > 0 && <AlertRow icon={AlertTriangle} severity="warning" text={`${projIssues.length} projects with missing fields`} />}
          {outIssues.length > 0 && <AlertRow icon={AlertTriangle} severity="warning" text={`${outIssues.length} outputs with missing fields`} />}
          {totalIssues === 0 && <AlertRow icon={CheckCircle} severity="success" text="All records pass integrity checks" />}
        </div>
      </Panel>

      <DashboardPanel title="Records with missing fields" noPad>
        <div style={{ display: 'flex', gap: 2, padding: '12px 24px 0' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '8px 16px', fontSize: 13, fontWeight: activeTab === t.key ? 600 : 500,
              color: activeTab === t.key ? C.brand : C.muted, background: activeTab === t.key ? C.accentSoft : 'transparent',
              border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontFamily: FONT,
            }}>{t.label}</button>
          ))}
        </div>
        <DashboardTable
          headers={[{ label: 'Record' }, { label: 'Division' }, { label: 'Missing fields' }]}
          rows={active.rows}
          emptyMessage="No issues found for this entity."
          renderRow={(r, i) => (
            <tr key={r.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{r.division || '—'}</td>
              <td style={{ padding: '10px 16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.missing.map(m => <span key={m} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, background: C.dangerSoft, color: C.danger }}>{m}</span>)}
                </div>
              </td>
            </tr>
          )}
        />
      </DashboardPanel>
    </div>
  );
}