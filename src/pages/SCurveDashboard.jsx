import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Target, Calendar, CheckCircle } from 'lucide-react';
import DashboardFilters from '../components/ui/DashboardFilters';
import {
  C, FONT, PageHeader, DashboardPanel, KPIBand, KPITile,
  DashboardTable, chartTickSmall, chartTickStyle, chartTooltipStyle, chartGridStroke
} from '@/components/ui/DashboardSystem';

export default function SCurveDashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarters, setQuarters] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [projectId, setProjectId] = useState('All');

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  // Filter activities (unchanged)
  const filteredActivities = activities.filter(activity => {
    if (divisions.length > 0 && !divisions.includes(activity.Functional_Division)) return false;
    if (projectId !== 'All' && !activity.Linked_Projects?.includes(projectId)) return false;
    const dateStr = activity.Planned_Start_Date || activity.Start_Date;
    if (year !== 'All') {
      if (!dateStr) return false;
      if (new Date(dateStr).getFullYear() !== year) return false;
    }
    if (quarters.length > 0) {
      if (!dateStr) return false;
      const q = `Q${Math.floor(new Date(dateStr).getMonth() / 3) + 1}`;
      if (!quarters.includes(q)) return false;
    }
    return true;
  });

  // Generate S-Curve data by month using cumulative financial progress % (unchanged)
  const generateSCurveData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totalAllocation = filteredActivities.reduce((sum, a) => sum + (a.Financial_Allocation || 0), 0);
    let cumulativePlannedAmt = 0;
    let cumulativeActualAmt = 0;

    return months.map((month, idx) => {
      const plannedThisMonthAmt = filteredActivities
        .filter(a => {
          const d = a.Planned_Completion_Date || a.End_Date;
          return d && new Date(d).getMonth() === idx;
        })
        .reduce((sum, a) => sum + (a.Financial_Allocation || 0), 0);

      const actualThisMonthAmt = filteredActivities
        .filter(a => {
          if (a.Workflow_Status !== 'Published') return false;
          const d = a.Published_Date || a.Date_Conducted || a.End_Date;
          return d && new Date(d).getMonth() === idx;
        })
        .reduce((sum, a) => sum + (a.Financial_Utilization || 0), 0);

      cumulativePlannedAmt += plannedThisMonthAmt;
      cumulativeActualAmt  += actualThisMonthAmt;

      const planned = totalAllocation > 0 ? parseFloat(((cumulativePlannedAmt / totalAllocation) * 100).toFixed(1)) : 0;
      const actual  = totalAllocation > 0 ? parseFloat(((cumulativeActualAmt  / totalAllocation) * 100).toFixed(1)) : 0;

      return { month, planned, actual, plannedAmt: cumulativePlannedAmt, actualAmt: cumulativeActualAmt, plannedThisMonth: plannedThisMonthAmt, actualThisMonth: actualThisMonthAmt };
    });
  };

  const scurveData = generateSCurveData();

  // Calculate stats (unchanged)
  const totalPlanned = filteredActivities.length;
  const totalCompleted = filteredActivities.filter(a => a.Workflow_Status === 'Published').length;
  const completionRate = totalPlanned > 0 ? ((totalCompleted / totalPlanned) * 100).toFixed(1) : 0;

  const currentMonth = new Date().getMonth();
  const plannedToDate = scurveData[currentMonth]?.planned || 0;
  const actualToDate  = scurveData[currentMonth]?.actual  || 0;
  const variance = parseFloat((actualToDate - plannedToDate).toFixed(1));

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="S-Curve Analysis" subtitle="Track planned vs actual cumulative financial progress" />

      <DashboardFilters
        year={year} setYear={setYear}
        quarters={quarters} setQuarters={setQuarters}
        divisions={divisions} setDivisions={setDivisions}
        projectId={projectId} setProjectId={setProjectId}
        projects={projects}
      />

      {/* KPI Band */}
      <KPIBand>
        <KPITile label="Total planned"   value={totalPlanned}                 icon={Target}      borderLeft={C.brand}      />
        <KPITile label="Completed"       value={totalCompleted}               icon={CheckCircle} borderLeft={C.successBar} />
        <KPITile label="Completion rate" value={`${completionRate}%`}         icon={TrendingUp}  borderLeft={C.accent}     />
        <KPITile label="Variance (YTD)"  value={`${variance >= 0 ? '+' : ''}${variance}%`} icon={Calendar} borderLeft={variance >= 0 ? C.successBar : C.dangerBar} />
      </KPIBand>

      {/* S-Curve Chart */}
      <DashboardPanel title="S-Curve: planned vs actual cumulative progress (%)" noPad>
        <div style={{ height: 360, padding: '16px 0 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scurveData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
              <XAxis dataKey="month" tick={chartTickStyle} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={chartTickSmall} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v, name) => [`${v}%`, name]} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: FONT }} />
              <Area type="monotone" dataKey="planned" stroke={C.brand} fill={C.brand} fillOpacity={0.15} name="Planned (cumulative)" />
              <Area type="monotone" dataKey="actual"  stroke={C.successBar} fill={C.successBar} fillOpacity={0.3} name="Actual (cumulative)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashboardPanel>

      {/* Monthly Breakdown */}
      <DashboardPanel title="Monthly financial progress (₱)" noPad>
        <div style={{ height: 280, padding: '16px 0 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scurveData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
              <XAxis dataKey="month" tick={chartTickStyle} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} tick={chartTickSmall} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={v => `₱${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: FONT }} />
              <Line type="monotone" dataKey="plannedThisMonth" stroke={C.brand} strokeWidth={2} name="Planned allocation (monthly)" />
              <Line type="monotone" dataKey="actualThisMonth"  stroke={C.successBar} strokeWidth={2} name="Actual utilization (monthly)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </DashboardPanel>

      {/* Data Table */}
      <DashboardPanel title="Monthly data summary" noPad>
        <DashboardTable
          headers={[
            { label: 'Month' },
            { label: 'Planned alloc. (month)', align: 'right' },
            { label: 'Actual util. (month)', align: 'right' },
            { label: 'Planned % (cumul.)', align: 'right' },
            { label: 'Actual % (cumul.)', align: 'right' },
            { label: 'Variance (%)', align: 'right' },
          ]}
          rows={scurveData}
          renderRow={(row, i) => {
            const varPct = parseFloat((row.actual - row.planned).toFixed(1));
            return (
              <tr key={row.month} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{row.month}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>₱{row.plannedThisMonth.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>₱{row.actualThisMonth.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{row.planned}%</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{row.actual}%</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: varPct >= 0 ? C.success : C.danger, textAlign: 'right' }}>
                  {varPct >= 0 ? '+' : ''}{varPct}%
                </td>
              </tr>
            );
          }}
        />
      </DashboardPanel>
    </div>
  );
}