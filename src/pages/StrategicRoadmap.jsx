import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, SectionHead, DashboardTable } from '@/components/ui/DashboardSystem';
import { Map, FolderKanban, Flag, Calendar } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_START = new Date('2026-01-01').getTime();
const YEAR_END = new Date('2026-12-31').getTime();
const YEAR_MS = YEAR_END - YEAR_START;

const pct = (dateStr) => {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.min(100, ((t - YEAR_START) / YEAR_MS) * 100));
};

const QUARTER_MONTH = { Q1: '2026-03-31', Q2: '2026-06-30', Q3: '2026-09-30', Q4: '2026-12-31' };

export default function StrategicRoadmap() {
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list('Project_Start_Date') });
  const { data: goals = [] } = useQuery({ queryKey: ['orgGoals'], queryFn: () => base44.entities.OrganizationalGoal.list() });

  const validProjects = projects.filter(p => p.Project_Start_Date && p.Project_End_Date);
  const milestones = goals.filter(g => g.Quarter).map(g => ({ ...g, pos: pct(QUARTER_MONTH[g.Quarter]) })).filter(m => m.pos != null);

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Strategic Roadmap" subtitle="Project timelines and organizational goal milestones against 2026 target dates" />
      <KPIBand>
        <KPITile label="Active projects" value={validProjects.length} icon={FolderKanban} borderLeft={C.brand} />
        <KPITile label="Strategic goals" value={goals.length} icon={Flag} borderLeft={C.accent} />
        <KPITile label="Milestones" value={milestones.length} icon={Calendar} borderLeft={C.successBar} />
        <KPITile label="Planning horizon" value="2026" icon={Map} borderLeft={C.warningBar} sub="Jan – Dec" />
      </KPIBand>

      <Panel>
        <SectionHead aside="2026 timeline">Project roadmap</SectionHead>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 720 }}>
            {/* Month header */}
            <div style={{ display: 'flex', position: 'relative', height: 24, marginBottom: 8 }}>
              {MONTHS.map((m, i) => (
                <div key={m} style={{ flex: 1, fontSize: 11, fontWeight: 600, color: C.muted, textAlign: 'center', borderLeft: i > 0 ? `1px solid ${C.border}` : 'none' }}>{m}</div>
              ))}
            </div>
            {/* Project bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
              {validProjects.map(p => {
                const start = pct(p.Project_Start_Date);
                const end = pct(p.Project_End_Date);
                const width = Math.max(2, end - start);
                const color = p.Project_Status === 'Completed' ? C.successBar : p.Project_Status === 'At Risk' || p.Project_Status === 'Delayed' ? C.dangerBar : p.Project_Status === 'Ongoing' ? C.accent : C.brand;
                return (
                  <div key={p.id} style={{ position: 'relative', height: 28 }}>
                    <div style={{ position: 'absolute', left: `${start}%`, width: `${width}%`, top: 2, bottom: 2, background: color, borderRadius: 5, opacity: 0.9, display: 'flex', alignItems: 'center', paddingLeft: 8, overflow: 'hidden' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.Project_Code || p.Project_Title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Milestone markers */}
            <div style={{ position: 'relative', height: 32, marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
              {milestones.map(m => (
                <div key={m.id} style={{ position: 'absolute', left: `${m.pos}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Flag size={14} color={C.warningBar} fill={C.warningSoft} />
                  <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, marginTop: 2, whiteSpace: 'nowrap' }}>{m.Quarter}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <SectionHead aside={`${milestones.length} milestones`}>Organizational goal milestones</SectionHead>
        <DashboardTable
          headers={[{ label: 'Goal' }, { label: 'Quarter' }, { label: 'Priority' }, { label: 'Status' }, { label: 'Progress', align: 'right' }]}
          rows={goals}
          emptyMessage="No organizational goals defined."
          renderRow={(g, i) => (
            <tr key={g.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text }}>{g.Goal_Title || g.Title}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, color: C.muted }}>{g.Quarter || '—'}</td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{g.Strategic_Priority || g.Priority_Level || '—'}</td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{g.Status || '—'}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.brand, textAlign: 'right' }}>{g.Current_Progress != null ? `${g.Current_Progress}%` : '—'}</td>
            </tr>
          )}
        />
      </Panel>
    </div>
  );
}