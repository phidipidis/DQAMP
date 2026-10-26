import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, DIVISIONS, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, SectionHead, DashboardTable } from '@/components/ui/DashboardSystem';
import { chartTickStyle, chartTickSmall, chartTooltipStyle, chartGridStroke } from '@/components/ui/DashboardSystem';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Target, CheckCircle, TrendingUp } from 'lucide-react';

const DIV_FULL = { CID: 'Curriculum & Instruction', SGOD: 'School Governance & Operations', OSDS: 'Schools Division Superintendent' };

export default function DivisionPerformance() {
  const { data: objectives = [] } = useQuery({ queryKey: ['divObjectives'], queryFn: () => base44.entities.DivisionObjective.list() });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });

  const divData = DIVISIONS.map(div => {
    const divObjs = objectives.filter(o => o.Functional_Division === div);
    const divActs = activities.filter(a => a.Functional_Division === div);
    const achieved = divObjs.filter(o => o.Status === 'Achieved').length;
    const achievementRate = divObjs.length > 0 ? Math.round((achieved / divObjs.length) * 100) : 0;
    const avgProgress = divObjs.length > 0 ? Math.round(divObjs.reduce((s, o) => s + (o.Current_Progress || 0), 0) / divObjs.length) : 0;
    const completed = divActs.filter(a => a.Status === 'Completed').length;
    const completionRate = divActs.length > 0 ? Math.round((completed / divActs.length) * 100) : 0;
    return { div, full: DIV_FULL[div], objectives: divObjs.length, achieved, achievementRate, avgProgress, activities: divActs.length, completed, completionRate };
  });

  const totalObj = divData.reduce((s, d) => s + d.objectives, 0);
  const totalAchieved = divData.reduce((s, d) => s + d.achieved, 0);
  const overallAchievement = totalObj > 0 ? Math.round((totalAchieved / totalObj) * 100) : 0;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Division Performance" subtitle="Achievement rates compared against set objectives by division" />
      <KPIBand>
        <KPITile label="Total objectives" value={totalObj} icon={Target} borderLeft={C.brand} />
        <KPITile label="Achieved" value={totalAchieved} icon={CheckCircle} borderLeft={C.successBar} />
        <KPITile label="Achievement rate" value={`${overallAchievement}%`} icon={TrendingUp} borderLeft={C.accent} />
        <KPITile label="Divisions" value={DIVISIONS.length} icon={Building2} borderLeft={C.warningBar} />
      </KPIBand>

      <Panel>
        <SectionHead aside="achievement vs completion %">Division comparison</SectionHead>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={divData} barCategoryGap="30%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
              <XAxis dataKey="div" tick={chartTickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={chartTickSmall} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v, n) => [`${v}%`, n === 'achievementRate' ? 'Achievement' : 'Completion']} />
              <Bar dataKey="achievementRate" name="achievementRate" fill={C.brand} radius={[4, 4, 0, 0]} />
              <Bar dataKey="completionRate" name="completionRate" fill={C.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <DashboardPanel title="Division achievement breakdown" noPad>
        <DashboardTable
          headers={[{ label: 'Division' }, { label: 'Objectives', align: 'right' }, { label: 'Achieved', align: 'right' }, { label: 'Achievement', align: 'right' }, { label: 'Avg progress', align: 'right' }, { label: 'Activities', align: 'right' }, { label: 'Completed', align: 'right' }]}
          rows={divData}
          renderRow={(d, i) => (
            <tr key={d.div} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.brand }}>{d.div}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{d.full}</div>
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted, textAlign: 'right' }}>{d.objectives}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.success, textAlign: 'right' }}>{d.achieved}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                  <div style={{ width: 50, height: 5, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.achievementRate}%`, background: d.achievementRate >= 70 ? C.successBar : d.achievementRate >= 40 ? C.warningBar : C.dangerBar, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.achievementRate >= 70 ? C.success : d.achievementRate >= 40 ? C.warningBar : C.danger, minWidth: 36 }}>{d.achievementRate}%</span>
                </div>
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{d.avgProgress}%</td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted, textAlign: 'right' }}>{d.activities}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted, textAlign: 'right' }}>{d.completed}</td>
            </tr>
          )}
        />
      </DashboardPanel>
    </div>
  );
}