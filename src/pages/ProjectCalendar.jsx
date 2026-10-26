import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, SectionHead } from '@/components/ui/DashboardSystem';
import { CalendarDays, ChevronLeft, ChevronRight, FolderKanban, PlayCircle, StopCircle } from 'lucide-react';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function ProjectCalendar() {
  const [viewDate, setViewDate] = useState(new Date(2026, 7, 1));
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const projectsStarting = projects.filter(p => p.Project_Start_Date && sameDay(new Date(p.Project_Start_Date), new Date(year, month, 1)) === false && new Date(p.Project_Start_Date).getMonth() === month && new Date(p.Project_Start_Date).getFullYear() === year);
  const startsByDay = {};
  const endsByDay = {};
  projects.forEach(p => {
    if (p.Project_Start_Date) {
      const d = new Date(p.Project_Start_Date);
      if (d.getMonth() === month && d.getFullYear() === year) (startsByDay[d.getDate()] ||= []).push(p);
    }
    if (p.Project_End_Date) {
      const d = new Date(p.Project_End_Date);
      if (d.getMonth() === month && d.getFullYear() === year) (endsByDay[d.getDate()] ||= []).push(p);
    }
  });

  const monthProjects = projects.filter(p => {
    const s = p.Project_Start_Date ? new Date(p.Project_Start_Date) : null;
    const e = p.Project_End_Date ? new Date(p.Project_End_Date) : null;
    const mStart = new Date(year, month, 1);
    const mEnd = new Date(year, month + 1, 0);
    return s && e && s <= mEnd && e >= mStart;
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Project Calendar" subtitle="Project start dates and critical deadlines across divisions" />
      <KPIBand>
        <KPITile label="Projects this month" value={monthProjects.length} icon={FolderKanban} borderLeft={C.brand} />
        <KPITile label="Starting" value={Object.values(startsByDay).reduce((s, a) => s + a.length, 0)} icon={PlayCircle} borderLeft={C.successBar} />
        <KPITile label="Ending" value={Object.values(endsByDay).reduce((s, a) => s + a.length, 0)} icon={StopCircle} borderLeft={C.danger} />
        <KPITile label="Total projects" value={projects.length} icon={CalendarDays} borderLeft={C.warningBar} />
      </KPIBand>

      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionHead>{MONTH_NAMES[month]} {year}</SectionHead>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={prevMonth} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={16} color={C.neutral} /></button>
            <button onClick={nextMonth} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={16} color={C.neutral} /></button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {DOW.map(d => <div key={d} style={{ fontSize: 11, fontWeight: 600, color: C.muted, textAlign: 'center', padding: '6px 0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{d}</div>)}
          {cells.map((date, i) => {
            if (!date) return <div key={i} style={{ minHeight: 84, background: C.bg, borderRadius: 6, opacity: 0.4 }} />;
            const day = date.getDate();
            const starts = startsByDay[day] || [];
            const ends = endsByDay[day] || [];
            return (
              <div key={i} style={{ minHeight: 84, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, textAlign: 'right' }}>{day}</span>
                {starts.map(p => (
                  <div key={'s' + p.id} title={`${p.Project_Title} starts`} style={{ fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 3, background: C.successSoft, color: C.success, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>▶ {p.Project_Code || p.Project_Title}</div>
                ))}
                {ends.map(p => (
                  <div key={'e' + p.id} title={`${p.Project_Title} ends`} style={{ fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 3, background: C.dangerSoft, color: C.danger, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>■ {p.Project_Code || p.Project_Title}</div>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12, color: C.muted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: C.successSoft, border: `1px solid ${C.success}` }} /> Start date</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: C.dangerSoft, border: `1px solid ${C.danger}` }} /> End date</span>
        </div>
      </Panel>

      <Panel>
        <SectionHead aside={`${monthProjects.length} projects`}>Projects in {MONTH_NAMES[month]} {year}</SectionHead>
        {monthProjects.length === 0 ? (
          <p style={{ fontSize: 13, color: C.muted, padding: '16px 0' }}>No projects scheduled this month.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {monthProjects.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
                <div style={{ width: 4, height: 32, borderRadius: 2, background: C.brand }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.Project_Code} — {p.Project_Title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.Functional_Division} · {p.Project_Status}</div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, textAlign: 'right' }}>
                  <div>{p.Project_Start_Date ? new Date(p.Project_Start_Date).toLocaleDateString() : '—'}</div>
                  <div style={{ fontSize: 10 }}>to {p.Project_End_Date ? new Date(p.Project_End_Date).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}