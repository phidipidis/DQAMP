import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, DIVISIONS, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, SectionHead, DashboardTable } from '@/components/ui/DashboardSystem';
import { chartTickStyle, chartTickSmall, chartTooltipStyle, chartGridStroke } from '@/components/ui/DashboardSystem';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, PhilippinePeso, TrendingUp, FolderKanban } from 'lucide-react';

const FUND_COLORS = { MOOE: C.brand, SARO: C.accent, SEF: C.successBar, Others: C.warningBar };
const PIE_COLORS = [C.brand, C.accent, C.successBar, C.warningBar];

export default function ResourceAllocation() {
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });

  const divData = DIVISIONS.map(div => {
    const divActs = activities.filter(a => a.Functional_Division === div);
    return {
      div,
      allocated: divActs.reduce((s, a) => s + (a.Financial_Allocation || 0), 0),
      utilized: divActs.reduce((s, a) => s + (a.Financial_Utilization || 0), 0),
    };
  });

  const fundData = ['MOOE', 'SARO', 'SEF', 'Others'].map(f => {
    const items = activities.filter(a => a.Funding_Source === f);
    return { name: f, value: items.reduce((s, a) => s + (a.Financial_Allocation || 0), 0), count: items.length };
  }).filter(d => d.value > 0);

  const totalAllocated = activities.reduce((s, a) => s + (a.Financial_Allocation || 0), 0);
  const totalUtilized = activities.reduce((s, a) => s + (a.Financial_Utilization || 0), 0);
  const utilRate = totalAllocated > 0 ? Math.round((totalUtilized / totalAllocated) * 100) : 0;

  const topProjects = [...projects].map(p => ({
    ...p,
    allocated: p.Financial_Allocation || p.Budget || 0,
    utilized: p.Financial_Utilization || p.Actual_Cost || 0,
  })).filter(p => p.allocated > 0).sort((a, b) => b.allocated - a.allocated).slice(0, 10);

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Resource Allocation" subtitle="Financial utilization across projects and divisions" />
      <KPIBand>
        <KPITile label="Total allocated" value={`₱${totalAllocated.toLocaleString()}`} icon={PhilippinePeso} borderLeft={C.brand} />
        <KPITile label="Total utilized" value={`₱${totalUtilized.toLocaleString()}`} icon={Wallet} borderLeft={C.accent} />
        <KPITile label="Utilization rate" value={`${utilRate}%`} icon={TrendingUp} borderLeft={C.successBar} />
        <KPITile label="Funding sources" value={fundData.length} icon={FolderKanban} borderLeft={C.warningBar} />
      </KPIBand>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
        <Panel>
          <SectionHead aside="allocated vs utilized">Allocation by division</SectionHead>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={divData} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="div" tick={chartTickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={chartTickSmall} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`₱${v.toLocaleString()}`, '']} />
                <Bar dataKey="allocated" name="Allocated" fill={C.accentSoft} radius={[4, 4, 0, 0]} />
                <Bar dataKey="utilized" name="Utilized" fill={C.brand} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <SectionHead>Funding source mix</SectionHead>
          {fundData.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '40px 0' }}>No data.</p>
          ) : (
            <>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fundData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2}>
                      {fundData.map((d, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `₱${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {fundData.map((f, i) => (
                  <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ color: C.text, flex: 1 }}>{f.name}</span>
                    <span style={{ fontWeight: 600, color: C.muted }}>₱{f.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>

      <DashboardPanel title="Top projects by allocation" aside="₱ amounts" noPad>
        <DashboardTable
          headers={[{ label: 'Project' }, { label: 'Division' }, { label: 'Allocated', align: 'right' }, { label: 'Utilized', align: 'right' }, { label: 'Rate', align: 'right' }]}
          rows={topProjects}
          emptyMessage="No projects with allocations."
          renderRow={(p, i) => {
            const rate = p.allocated > 0 ? Math.round((p.utilized / p.allocated) * 100) : 0;
            return (
              <tr key={p.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text, maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.Project_Code} — {p.Project_Title}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{p.Functional_Division}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.brand, textAlign: 'right' }}>₱{p.allocated.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, color: C.muted, textAlign: 'right' }}>₱{p.utilized.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, textAlign: 'right', color: rate > 100 ? C.danger : rate >= 70 ? C.success : C.warningBar }}>{rate}%</td>
              </tr>
            );
          }}
        />
      </DashboardPanel>
    </div>
  );
}