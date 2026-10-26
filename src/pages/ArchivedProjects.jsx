import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, SectionHead, DashboardTable } from '@/components/ui/DashboardSystem';
import { Archive, FolderKanban, ClipboardList, Package } from 'lucide-react';

export default function ArchivedProjects() {
  const [expanded, setExpanded] = useState(null);

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: outputs = [] } = useQuery({ queryKey: ['outputs'], queryFn: () => base44.entities.ProjectOutputs.list() });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });

  const archived = projects.filter(p => p.Project_Status === 'Completed');
  const archivedIds = new Set(archived.map(p => p.id));
  const archivedOutputs = outputs.filter(o => archivedIds.has(o.Linked_Project));
  const archivedActivityIds = new Set();
  archived.forEach(p => (p.Linked_Activities || []).forEach(id => archivedActivityIds.add(id)));
  activities.forEach(a => { if (a.Linked_Projects?.some(pid => archivedIds.has(pid))) archivedActivityIds.add(a.id); });
  const archivedActivities = activities.filter(a => archivedActivityIds.has(a.id));

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Archived Projects" subtitle="Completed projects and their historical outputs" />
      <KPIBand>
        <KPITile label="Archived projects" value={archived.length} icon={Archive} borderLeft={C.brand} />
        <KPITile label="Total outputs" value={archivedOutputs.length} icon={Package} borderLeft={C.accent} />
        <KPITile label="Total activities" value={archivedActivities.length} icon={ClipboardList} borderLeft={C.successBar} />
        <KPITile label="Active projects" value={projects.length - archived.length} icon={FolderKanban} borderLeft={C.warningBar} />
      </KPIBand>

      {archived.length === 0 ? (
        <Panel>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Archive size={32} color={C.muted} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: C.muted }}>No completed projects have been archived yet.</p>
          </div>
        </Panel>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {archived.map(p => {
            const pOutputs = outputs.filter(o => o.Linked_Project === p.id);
            const pActivities = activities.filter(a => a.Linked_Projects?.includes(p.id) || p.Linked_Activities?.includes(a.id));
            const isOpen = expanded === p.id;
            return (
              <Panel key={p.id} padded={false} style={{ overflow: 'hidden' }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Archive size={18} color={C.brand} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.Project_Code} — {p.Project_Title}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.Functional_Division} · {pOutputs.length} outputs · {pActivities.length} activities</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{isOpen ? 'Hide' : 'View'} details</span>
                </button>
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 24px' }}>
                    <SectionHead aside={`${pOutputs.length} items`}>Outputs</SectionHead>
                    <DashboardTable
                      headers={[{ label: 'Title' }, { label: 'Type' }, { label: 'Status' }, { label: 'Target', align: 'right' }]}
                      rows={pOutputs}
                      emptyMessage="No outputs recorded."
                      renderRow={(o, i) => (
                        <tr key={o.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                          <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500, color: C.text }}>{o.Output_Title || '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: C.muted }}>{o.Output_Type || '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: C.muted }}>{o.Status || '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: C.muted, textAlign: 'right' }}>{o.Target_Quantity || '—'}</td>
                        </tr>
                      )}
                    />
                    <SectionHead aside={`${pActivities.length} items`} style={{ marginTop: 18 }}>Activities</SectionHead>
                    <DashboardTable
                      headers={[{ label: 'Activity' }, { label: 'Type' }, { label: 'Status' }]}
                      rows={pActivities}
                      emptyMessage="No activities recorded."
                      renderRow={(a, i) => (
                        <tr key={a.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                          <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500, color: C.text }}>{a.Activity_Title || a.Title}</td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: C.muted }}>{a.Activity_Type || '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: C.muted }}>{a.Status || '—'}</td>
                        </tr>
                      )}
                    />
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}