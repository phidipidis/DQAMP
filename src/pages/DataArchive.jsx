import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, DashboardPanel, DashboardTable, SegmentedFilter } from '@/components/ui/DashboardSystem';
import { Archive, RotateCcw, ArrowRight, Building2, Calendar } from 'lucide-react';

export default function DataArchive() {
  const queryClient = useQueryClient();
  const [yearFilter, setYearFilter] = useState('All');

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: archived = [] } = useQuery({ queryKey: ['archivedProjects'], queryFn: () => base44.entities.ArchivedProject.list('-Archived_Date') });

  const eligible = projects.filter(p => p.Project_Status === 'Completed');
  const filteredArchived = yearFilter === 'All' ? archived : archived.filter(a => String(a.Fiscal_Year) === yearFilter);
  const archiveYears = [...new Set(archived.map(a => a.Fiscal_Year).filter(Boolean))].sort((a, b) => b - a);

  const archive = async (p) => {
    if (!confirm(`Archive "${p.Project_Title}"? This moves it to the archive store.`)) return;
    const me = await base44.auth.me();
    const year = p.Project_Start_Date ? new Date(p.Project_Start_Date).getFullYear() : new Date().getFullYear();
    await base44.entities.ArchivedProject.create({
      Original_Project_ID: p.id,
      Project_Code: p.Project_Code,
      Project_Title: p.Project_Title,
      Functional_Division: p.Functional_Division,
      Fiscal_Year: year,
      Project_Status: p.Project_Status,
      Financial_Allocation: p.Financial_Allocation || 0,
      Financial_Utilization: p.Financial_Utilization || 0,
      Summary: `Archived from active projects. ${p.Project_Description || ''}`.trim(),
      Archived_Date: new Date().toISOString().slice(0, 10),
      Archived_By: me.email,
    });
    await base44.entities.Project.delete(p.id);
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    await queryClient.invalidateQueries({ queryKey: ['archivedProjects'] });
  };

  const restore = async (a) => {
    if (!confirm(`Restore "${a.Project_Title}" back to active projects?`)) return;
    await base44.entities.Project.create({
      Project_Code: a.Project_Code || `RESTORED-${a.id.slice(-4)}`,
      Project_Title: a.Project_Title,
      Functional_Division: a.Functional_Division || 'CID',
      Project_Status: 'Completed',
      Financial_Allocation: a.Financial_Allocation || 0,
      Financial_Utilization: a.Financial_Utilization || 0,
    });
    await base44.entities.ArchivedProject.delete(a.id);
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    await queryClient.invalidateQueries({ queryKey: ['archivedProjects'] });
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Data Archive" subtitle="Securely archive and store completed project records from previous fiscal years" />
      <KPIBand>
        <KPITile label="Eligible for archive" value={eligible.length} icon={Archive} borderLeft={C.warningBar} sub="completed projects" />
        <KPITile label="Archived records" value={archived.length} icon={Archive} borderLeft={C.brand} />
        <KPITile label="Archive years" value={archiveYears.length} icon={Calendar} borderLeft={C.accent} />
        <KPITile label="Total archived value" value={`₱${archived.reduce((s, a) => s + (a.Financial_Allocation || 0), 0).toLocaleString()}`} icon={Building2} borderLeft={C.successBar} />
      </KPIBand>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <DashboardPanel title="Eligible for archive" aside={`${eligible.length} completed`} noPad>
          <DashboardTable
            headers={[{ label: 'Project' }, { label: 'Division' }, { label: '' }]}
            rows={eligible}
            emptyMessage="No completed projects eligible for archive."
            renderRow={(p, i) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.Project_Title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.Project_Code || '—'}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{p.Functional_Division || '—'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => archive(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: C.brand, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>Archive <ArrowRight size={13} /></button>
                </td>
              </tr>
            )}
          />
        </DashboardPanel>

        <DashboardPanel title="Archived records" aside={`${filteredArchived.length} stored`} noPad>
          <div style={{ padding: '0 24px 14px' }}>
            <SegmentedFilter options={archiveYears.map(String)} selected={yearFilter} onToggle={setYearFilter} multi={false} includeAll />
          </div>
          <DashboardTable
            headers={[{ label: 'Project' }, { label: 'FY' }, { label: 'Archived' }, { label: '' }]}
            rows={filteredArchived}
            emptyMessage="No archived records."
            renderRow={(a, i) => (
              <tr key={a.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.Project_Title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{a.Functional_Division || '—'} · {a.Archived_By || '—'}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.brand }}>{a.Fiscal_Year || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{a.Archived_Date || '—'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => restore(a)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: C.success, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}><RotateCcw size={13} /> Restore</button>
                </td>
              </tr>
            )}
          />
        </DashboardPanel>
      </div>
    </div>
  );
}