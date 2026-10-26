import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, SectionHead } from '@/components/ui/DashboardSystem';
import { chartTickStyle, chartTickSmall, chartTooltipStyle, chartGridStroke } from '@/components/ui/DashboardSystem';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MessageSquare, TrendingUp, Smile, Users } from 'lucide-react';

const SQD = [
  { key: 'SQD0_Overall_Satisfaction', label: 'Overall' },
  { key: 'SQD1_Responsiveness', label: 'Responsiveness' },
  { key: 'SQD2_Reliability', label: 'Reliability' },
  { key: 'SQD3_Access_Facilities', label: 'Access/Facilities' },
  { key: 'SQD4_Communication', label: 'Communication' },
  { key: 'SQD5_Costs', label: 'Costs' },
  { key: 'SQD6_Integrity', label: 'Integrity' },
  { key: 'SQD7_Assurance', label: 'Assurance' },
  { key: 'SQD8_Outcome', label: 'Outcome' },
];

const PIE_COLORS = [C.brand, C.accent, C.successBar, C.warningBar];

export default function FeedbackAnalytics() {
  const { data: feedback = [] } = useQuery({ queryKey: ['artaFeedback'], queryFn: () => base44.entities.ARTAFeedback.list() });

  const dimData = SQD.map(d => {
    const vals = feedback.map(f => f[d.key]).filter(v => typeof v === 'number');
    return { dim: d.label, score: vals.length > 0 ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2) : 0 };
  });

  const customerTypes = ['Citizen', 'Business', 'Government'].map(t => ({ name: t, value: feedback.filter(f => f.Customer_Type === t).length })).filter(d => d.value > 0);

  const byPeriod = {};
  feedback.forEach(f => {
    const key = `${f.Year || ''} ${f.Quarter || ''}`.trim() || 'Unspecified';
    if (!byPeriod[key]) byPeriod[key] = { period: key, sum: 0, count: 0 };
    const v = f.SQD0_Overall_Satisfaction;
    if (typeof v === 'number') { byPeriod[key].sum += v; byPeriod[key].count += 1; }
  });
  const trend = Object.values(byPeriod).map(b => ({ period: b.period, score: b.count > 0 ? +(b.sum / b.count).toFixed(2) : 0 })).sort((a, b) => a.period.localeCompare(b.period));

  const avgOverall = dimData[0]?.score || 0;
  const positive = feedback.filter(f => (f.SQD0_Overall_Satisfaction || 0) >= 4).length;
  const sentimentRate = feedback.length > 0 ? Math.round((positive / feedback.length) * 100) : 0;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Feedback Analytics" subtitle="ARTA survey results — sentiment trends and service quality scores" />
      <KPIBand>
        <KPITile label="Total responses" value={feedback.length} icon={MessageSquare} borderLeft={C.brand} />
        <KPITile label="Avg satisfaction" value={avgOverall ? avgOverall.toFixed(2) : '—'} icon={TrendingUp} borderLeft={C.successBar} sub="1–5 scale" />
        <KPITile label="Positive sentiment" value={`${sentimentRate}%`} icon={Smile} borderLeft={C.accent} sub={`${positive} rated ≥4`} />
        <KPITile label="Customer types" value={customerTypes.length} icon={Users} borderLeft={C.warningBar} />
      </KPIBand>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
        <Panel>
          <SectionHead aside="average score (1–5)">Service quality dimensions (SQD)</SectionHead>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dimData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={chartTickSmall} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="dim" tick={chartTickStyle} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [v, 'Avg score']} />
                <Bar dataKey="score" name="Score" fill={C.brand} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <SectionHead>Customer type mix</SectionHead>
          {customerTypes.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '40px 0' }}>No data.</p>
          ) : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={customerTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {customerTypes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {customerTypes.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span style={{ color: C.text, flex: 1 }}>{c.name}</span>
                <span style={{ fontWeight: 600, color: C.muted }}>{c.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <DashboardPanel title="Satisfaction trend" aside="overall satisfaction by period" noPad>
        <div style={{ padding: '0 24px 22px' }}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="period" tick={chartTickStyle} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={chartTickSmall} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [v, 'Satisfaction']} />
                <Line type="monotone" dataKey="score" stroke={C.brand} strokeWidth={2.5} dot={{ r: 4, fill: C.brand }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}