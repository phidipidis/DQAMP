import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, DIVISIONS, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, SectionHead, DashboardTable } from '@/components/ui/DashboardSystem';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartTickStyle, chartTickSmall, chartTooltipStyle, chartGridStroke } from '@/components/ui/DashboardSystem';
import { BarChart3, ClipboardList, PhilippinePeso, TrendingUp } from 'lucide-react';

const DIV_FULL = { CID: 'Curriculum & Instruction', SGOD: 'School Governance & Operations', OSDS: 'Schools Division Superintendent' };

export default function DivisionPerformanceSummary() {
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });

  const divisionData = DIVISIONS.map(div => {
    const divActs = activities.filter(a => a.Functional_Division === div);
    const divProjects = projects.filter(p => p.Functional_Division === div);
    const completed = divActs.filter(a => a.Status === 'Completed').length;
    const completionRate = divActs.length > 0 ? Math.round((completed / divActs.length) * 100) : 0;
    const allocated = divActs.reduce((s, a) => s + (a.Financial_Allocation || 0), 0);
    const utilized = divActs.reduce((s, a) => s + (a.Financial_Utilization || 0), 0);
    const utilRate = allocated > 0 ? Math.round((utilized / allocated) * 100) : 0;
    const qameCovered = divActs.filter(a => a.QAME_Rating).length;
    const qameRate = divActs.length > 0 ? Math.round((qameCovered / divActs.length) * 100) : 0;
    return { div, full: DIV_FULL[div], activities: divActs.length, projects: divProjects.length, completed, completionRate, allocated, utilized, utilRate, qameCovered, qameRate };
  });

  const totals = {
    activities: divisionData.reduce((s, d) => s + d.activities, 0),
    completed: divisionData.reduce((s, d) => s + d.completed, 0),
    allocated: divisionData.reduce((s, d) => s + d.allocated, 0),
    utilized: divisionData.reduce((s, d) => s + d.utilized, 0),
  };
  const overallCompletion = totals.activities > 0 ? Math.round((totals.completed / totals.activities) * 100) : 0;
  const overallUtil = totals.allocated > 0 ? Math.round((totals.utilized / totals.allocated) * 100) : 0;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Division Performance Summary" subtitle="Aggregated performance metrics by functional division" />
      <KPIBand>
        <KPITile label="Total activities" value={totals.activities} icon={ClipboardList} borderLeft={C.brand} />
        <KPITile label="Completion rate" value={`${overallCompletion}%`} icon={TrendingUp} borderLeft={C.successBar} sub={`${totals.completed} completed`} />
        <KPITile label="Total allocated" value={`₱${totals.allocated.toLocaleString()}`} icon={PhilippinePeso} borderLeft={C.accent} />
        <KPITile label="Utilization rate" value={`${overallUtil}%`} icon={BarChart3} borderLeft={C.warningBar} sub={`₱${totals.utilized.toLocaleString()} spent`} />
      </KPIBand>

      <Panel>
        <SectionHead aside="completion %">Division comparison</SectionHead>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={divisionData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
              <XAxis dataKey="div" tick={chartTickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={chartTickSmall} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v, n) => [n === 'completionRate' ? `${v}%` : v, n === 'completionRate' ? 'Completion' : 'Activities']} />
              <Bar dataKey="activities" name="Activities" fill={C.accentSoft} radius={[4, 4, 0, 0]} />
              <Bar dataKey="completionRate" name="Completion" fill={C.brand} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <DashboardPanel title="Division breakdown" noPad>
        <DashboardTable
          headers={[
            { label: 'Division' }, { label: 'Activities', align: 'right' }, { label: 'Projects', align: 'right' },
            { label: 'Completion', align: 'right' }, { label: 'Allocated', align: 'right' }, { label: 'Utilized', align: 'right' },
            { label: 'Util. rate', align: 'right' }, { label: 'QAME', align: 'right' },
          ]}
          rows={divisionData}
          renderRow={(d, i) => (
            <tr key={d.div} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.brand }}>{d.div}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{d.full}</div>
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{d.activities}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted, textAlign: 'right' }}>{d.projects}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: d.completionRate >= 70 ? C.success : d.completionRate >= 40 ? C.warningBar : C.danger }}>{d.completionRate}%</span>
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted, textAlign: 'right' }}>₱{d.allocated.toLocaleString()}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted, textAlign: 'right' }}>₱{d.utilized.toLocaleString()}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{d.utilRate}%</td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted, textAlign: 'right' }}>{d.qameCovered}/{d.activities}</td>
            </tr>
          )}
        />
      </DashboardPanel>
    </div>
  );
}