import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, SectionHead } from '@/components/ui/DashboardSystem';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartTickStyle, chartTickSmall, chartTooltipStyle, chartGridStroke } from '@/components/ui/DashboardSystem';
import { LineChart as LineIcon, MessageSquare, ScrollText, TrendingUp } from 'lucide-react';

const SQD_KEYS = ['SQD0_Overall_Satisfaction', 'SQD1_Responsiveness', 'SQD2_Reliability', 'SQD3_Access_Facilities', 'SQD4_Communication', 'SQD5_Costs', 'SQD6_Integrity', 'SQD7_Assurance', 'SQD8_Outcome'];

export default function ComplianceTrends() {
  const { data: feedback = [] } = useQuery({ queryKey: ['artaFeedback'], queryFn: () => base44.entities.ARTAFeedback.list() });
  const { data: auditLogs = [] } = useQuery({ queryKey: ['auditLogsTrends'], queryFn: () => base44.entities.Audit_Log.list('-Timestamp', 500) });

  // Feedback by quarter
  const byQuarter = {};
  feedback.forEach(f => {
    const key = `${f.Year || ''} ${f.Quarter || ''}`.trim() || 'Unspecified';
    if (!byQuarter[key]) byQuarter[key] = { period: key, sum: 0, count: 0 };
    const vals = SQD_KEYS.map(k => f[k]).filter(v => typeof v === 'number');
    if (vals.length > 0) {
      byQuarter[key].sum += vals.reduce((s, v) => s + v, 0) / vals.length;
      byQuarter[key].count += 1;
    }
  });
  const feedbackTrend = Object.values(byQuarter).map(b => ({ period: b.period, avgScore: b.count > 0 ? +(b.sum / b.count).toFixed(2) : 0 })).sort((a, b) => a.period.localeCompare(b.period));

  // Audit events by month
  const byMonth = {};
  auditLogs.forEach(l => {
    if (!l.Timestamp) return;
    const d = new Date(l.Timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  });
  const auditTrend = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([month, count]) => ({ month, events: count }));

  const avgScore = feedbackTrend.length > 0 ? feedbackTrend.reduce((s, d) => s + d.avgScore, 0) / feedbackTrend.length : 0;
  const totalEvents = auditTrend.reduce((s, d) => s + d.events, 0);

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Feedback & Compliance Trends" subtitle="Customer satisfaction scores and audit activity over time" />
      <KPIBand>
        <KPITile label="Feedback responses" value={feedback.length} icon={MessageSquare} borderLeft={C.brand} />
        <KPITile label="Avg SQD score" value={avgScore ? avgScore.toFixed(2) : '—'} icon={TrendingUp} borderLeft={C.successBar} sub="1–5 scale" />
        <KPITile label="Audit events" value={totalEvents} icon={ScrollText} borderLeft={C.accent} sub="last 12 months" />
        <KPITile label="Reporting periods" value={feedbackTrend.length} icon={LineIcon} borderLeft={C.warningBar} />
      </KPIBand>

      <Panel>
        <SectionHead aside="average SQD score (1–5)">Feedback score trend</SectionHead>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={feedbackTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
              <XAxis dataKey="period" tick={chartTickStyle} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={chartTickSmall} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [v, 'Avg SQD']} />
              <Line type="monotone" dataKey="avgScore" stroke={C.brand} strokeWidth={2.5} dot={{ r: 4, fill: C.brand }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <DashboardPanel title="Audit activity by month" aside="system events" noPad>
        <div style={{ padding: '0 24px 22px' }}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={auditTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="month" tick={chartTickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={chartTickSmall} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [v, 'Events']} />
                <Bar dataKey="events" name="Events" fill={C.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}