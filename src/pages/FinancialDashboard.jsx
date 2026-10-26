import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import { useFilters } from '@/lib/FilterContext';
import {
  C, FONT, PageHeader, DashboardPanel, KPIBand, KPITile,
  chartTickStyle, chartTickSmall, chartTooltipStyle, chartGridStroke
} from '@/components/ui/DashboardSystem';

const CHART_COLORS = [C.brand, C.accent, C.warningBar, C.successBar, C.dangerBar, C.muted];

export default function FinancialDashboard() {
  const { matchesFilters } = useFilters();

  // ── Data fetching (unchanged) ─────────────────────────────────────────────
  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const filteredActivities = activities.filter(activity => matchesFilters(activity));

  // ── Calculations (unchanged) ──────────────────────────────────────────────
  const totalAllocation  = filteredActivities.reduce((sum, a) => sum + (a.Financial_Allocation  || 0), 0);
  const utilizedAmount   = filteredActivities.reduce((sum, a) => sum + (a.Financial_Utilization || 0), 0);
  const pendingAmount    = totalAllocation - utilizedAmount;
  const utilizationRate  = totalAllocation > 0 ? ((utilizedAmount / totalAllocation) * 100).toFixed(1) : 0;

  const byDivision = ['CID', 'SGOD', 'OSDS'].map(div => {
    const divActivities = filteredActivities.filter(a => a.Functional_Division === div);
    const allocation = divActivities.reduce((sum, a) => sum + (a.Financial_Allocation  || 0), 0);
    const utilized   = divActivities.reduce((sum, a) => sum + (a.Financial_Utilization || 0), 0);
    return { division: div, allocation, utilized, pending: allocation - utilized };
  });

  const byFundingSource = ['MOOE', 'SARO', 'SEF', 'Others'].map(source => {
    const amount = filteredActivities
      .filter(a => a.Funding_Source === source)
      .reduce((sum, a) => sum + (a.Financial_Allocation || 0), 0);
    return { name: source, value: amount };
  }).filter(s => s.value > 0);

  const byCategory = ['Training', 'Program LRM', 'PIR', 'Research', 'Conference'].map(cat => {
    const amount = filteredActivities
      .filter(a => a.Category === cat)
      .reduce((sum, a) => sum + (a.Financial_Allocation || 0), 0);
    return { category: cat, amount };
  }).filter(c => c.amount > 0);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyData = months.map((month, idx) => {
    const monthActivities = filteredActivities.filter(a => {
      if (!a.Planned_Disbursement_Date) return false;
      return new Date(a.Planned_Disbursement_Date).getMonth() === idx;
    });
    const planned = monthActivities.reduce((sum, a) => sum + (a.Financial_Allocation || 0), 0);
    const utilizedActivities = filteredActivities.filter(a => {
      const dateStr = a.Published_Date || a.Date_Conducted || a.End_Date;
      if (!dateStr) return false;
      return new Date(dateStr).getMonth() === idx;
    });
    const actual = utilizedActivities.reduce((sum, a) => sum + (a.Financial_Utilization || 0), 0);
    return { month, planned, actual };
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Financial Analysis" subtitle="Allocation vs utilization monitoring" />

      {/* KPI Band */}
      <KPIBand>
        <KPITile label="Total allocation"  value={`₱${totalAllocation.toLocaleString()}`} icon={Wallet}       borderLeft={C.brand}      />
        <KPITile label="Utilized"          value={`₱${utilizedAmount.toLocaleString()}`}  icon={DollarSign}    borderLeft={C.successBar} />
        <KPITile label="Pending"           value={`₱${pendingAmount.toLocaleString()}`}   icon={PiggyBank}     borderLeft={C.warningBar} />
        <KPITile label="Utilization rate"  value={`${utilizationRate}%`}                  icon={TrendingUp}    borderLeft={C.accent}     />
      </KPIBand>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <DashboardPanel title="Allocation by division" noPad>
          <div style={{ height: 260, padding: '16px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDivision}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="division" tick={chartTickStyle} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} tick={chartTickSmall} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={v => `₱${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: FONT }} />
                <Bar dataKey="allocation" fill={C.brand}       name="Allocated" radius={[4,4,0,0]} />
                <Bar dataKey="utilized"   fill={C.successBar}  name="Utilized"  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel title="By funding source" noPad>
          <div style={{ height: 260, padding: '16px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byFundingSource}
                  cx="50%" cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                  style={{ fontSize: 13, fontFamily: FONT }}
                >
                  {byFundingSource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} formatter={v => `₱${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>
      </div>

      {/* Monthly Trend */}
      <DashboardPanel title="Monthly financial trend" noPad>
        <div style={{ height: 280, padding: '16px 0 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
              <XAxis dataKey="month" tick={chartTickSmall} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} tick={chartTickSmall} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={v => `₱${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: FONT }} />
              <Bar dataKey="planned" fill={C.brand}      name="Planned disbursement" radius={[4,4,0,0]} />
              <Bar dataKey="actual"  fill={C.successBar} name="Actual utilized"       radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardPanel>

      {/* By Category */}
      <DashboardPanel title="Allocation by category" noPad>
        <div style={{ height: 240, padding: '16px 0 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
              <XAxis type="number" tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} tick={chartTickSmall} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" width={110} tick={chartTickSmall} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={v => `₱${v.toLocaleString()}`} />
              <Bar dataKey="amount" fill={C.accent} name="Amount" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardPanel>
    </div>
  );
}