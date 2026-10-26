import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, Panel, DashboardPanel, SectionHead } from '@/components/ui/DashboardSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileBarChart, Download, Calendar, Database, FileText } from 'lucide-react';
import { createDoc, drawReportHeader, drawSummaryStats, drawSectionHeading, drawTable, drawFooter } from '@/lib/pdfReportTemplate';

const DATA_POINTS = [
  { key: 'activities', label: 'Activities', icon: FileText, color: C.brand },
  { key: 'projects', label: 'Projects', icon: Database, color: C.accent },
  { key: 'feedback', label: 'ARTA Feedback', icon: FileText, color: C.successBar },
  { key: 'objectives', label: 'Division Objectives', icon: Database, color: C.warningBar },
];

export default function ReportGenerator() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState({ activities: true, projects: true, feedback: false, objectives: false });
  const [generating, setGenerating] = useState(false);

  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: feedback = [] } = useQuery({ queryKey: ['artaFeedback'], queryFn: () => base44.entities.ARTAFeedback.list() });
  const { data: objectives = [] } = useQuery({ queryKey: ['divObjectives'], queryFn: () => base44.entities.DivisionObjective.list() });

  const dataMap = { activities, projects, feedback, objectives };

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
    return true;
  };

  const hasDateFilter = !!(startDate && endDate);

  const toggle = (key) => setSelected(s => ({ ...s, [key]: !s[key] }));

  const generate = async () => {
    setGenerating(true);
    try {
      const doc = createDoc('landscape');
      const period = hasDateFilter ? `${startDate} to ${endDate}` : 'All time';
      let y = drawReportHeader(doc, { reportTitle: 'Custom Report', reportSubtitle: 'DQAMP Portal', reportingPeriod: period });
      y += 2;

      const stats = [];
      if (selected.activities) {
        const filtered = hasDateFilter ? activities.filter(a => inRange(a.Start_Date || a.Date_Conducted)) : activities;
        stats.push({ label: 'Activities', value: String(filtered.length) });
      }
      if (selected.projects) {
        const filtered = hasDateFilter ? projects.filter(p => inRange(p.Project_Start_Date)) : projects;
        stats.push({ label: 'Projects', value: String(filtered.length) });
      }
      if (selected.feedback) {
        const filtered = hasDateFilter ? feedback.filter(f => inRange(f.Survey_Date)) : feedback;
        stats.push({ label: 'Feedback', value: String(filtered.length) });
      }
      if (selected.objectives) {
        stats.push({ label: 'Objectives', value: String(objectives.length) });
      }

      if (stats.length > 0) {
        y = drawSummaryStats(doc, stats, y);
        y += 4;
      }

      if (selected.activities) {
        const filtered = hasDateFilter ? activities.filter(a => inRange(a.Start_Date || a.Date_Conducted)) : activities;
        y = drawSectionHeading(doc, 'Activities', y);
        y = drawTable(doc,
          ['Title', 'Division', 'Type', 'Status', 'Allocation'],
          filtered.slice(0, 100).map(a => [
            (a.Activity_Title || a.Title || '—').slice(0, 40),
            a.Functional_Division || '—',
            a.Activity_Type || '—',
            a.Status || '—',
            `₱${(a.Financial_Allocation || 0).toLocaleString()}`,
          ]),
          y,
          [70, 25, 45, 30, 35],
          { alignRight: [4] }
        );
        y += 4;
      }

      if (selected.projects) {
        const filtered = hasDateFilter ? projects.filter(p => inRange(p.Project_Start_Date)) : projects;
        if (y > 160) { doc.addPage(); y = 20; }
        y = drawSectionHeading(doc, 'Projects', y);
        y = drawTable(doc,
          ['Code', 'Title', 'Division', 'Status', 'Allocation'],
          filtered.slice(0, 100).map(p => [
            (p.Project_Code || '—').slice(0, 15),
            (p.Project_Title || '—').slice(0, 40),
            p.Functional_Division || '—',
            p.Project_Status || '—',
            `₱${(p.Financial_Allocation || 0).toLocaleString()}`,
          ]),
          y,
          [30, 75, 25, 30, 35],
          { alignRight: [4] }
        );
        y += 4;
      }

      if (selected.feedback) {
        const filtered = hasDateFilter ? feedback.filter(f => inRange(f.Survey_Date)) : feedback;
        if (y > 160) { doc.addPage(); y = 20; }
        y = drawSectionHeading(doc, 'ARTA Feedback', y);
        y = drawTable(doc,
          ['Activity', 'Customer Type', 'Quarter', 'Avg SQD', 'Date'],
          filtered.slice(0, 100).map(f => [
            (f.Activity_Title || f.Linked_Activity || '—').slice(0, 40),
            f.Customer_Type || '—',
            f.Quarter || '—',
            (f.Average_SQD_Score || 0).toFixed(2),
            f.Survey_Date || '—',
          ]),
          y,
          [65, 35, 20, 25, 30]
        );
        y += 4;
      }

      if (selected.objectives) {
        if (y > 160) { doc.addPage(); y = 20; }
        y = drawSectionHeading(doc, 'Division Objectives', y);
        y = drawTable(doc,
          ['Code', 'Objective', 'Division', 'Status', 'Progress'],
          objectives.slice(0, 100).map(o => [
            (o.Objective_Code || '—').slice(0, 15),
            (o.Objective_Title || '—').slice(0, 50),
            o.Functional_Division || '—',
            o.Status || '—',
            `${o.Current_Progress || 0}%`,
          ]),
          y,
          [30, 80, 25, 30, 25]
        );
      }

      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        drawFooter(doc, p, totalPages);
      }

      doc.save(`DQAMP_Custom_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally { setGenerating(false); }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Report Generator" subtitle="Select a date range and data points to generate a custom PDF report" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <DashboardPanel title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={16} color={C.brand} /> Date range</span>} noPad>
            <div style={{ padding: '0 24px 22px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><Label>Start date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                <div><Label>End date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>Leave blank to include all records regardless of date.</p>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Database size={16} color={C.brand} /> Data points</span>} noPad>
            <div style={{ padding: '0 24px 22px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DATA_POINTS.map(dp => {
                  const Icon = dp.icon;
                  const isOn = selected[dp.key];
                  const count = (dataMap[dp.key] || []).length;
                  return (
                    <button key={dp.key} onClick={() => toggle(dp.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: `1px solid ${isOn ? dp.color : C.border}`, background: isOn ? dp.color + '08' : C.surface, cursor: 'pointer', fontFamily: FONT, textAlign: 'left' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: (isOn ? dp.color : C.muted) + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={15} color={isOn ? dp.color : C.muted} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{dp.label}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{count} records available</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isOn ? dp.color : C.border}`, background: isOn ? dp.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isOn && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </DashboardPanel>

          <Button onClick={generate} variant="primary" disabled={generating || selectedCount === 0} style={{ width: '100%' }}>
            {generating ? 'Generating...' : <><Download size={15} /> Generate PDF ({selectedCount} section{selectedCount !== 1 ? 's' : ''})</>}
          </Button>
        </div>

        <Panel>
          <SectionHead aside="preview">Report summary</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 18, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <FileBarChart size={18} color={C.brand} />
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Custom DQAMP Report</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: C.muted }}>Date range</span><span style={{ fontWeight: 600, color: C.text }}>{hasDateFilter ? `${startDate} → ${endDate}` : 'All time'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: C.muted }}>Sections</span><span style={{ fontWeight: 600, color: C.text }}>{selectedCount}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: C.muted }}>Format</span><span style={{ fontWeight: 600, color: C.text }}>PDF (landscape)</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DATA_POINTS.filter(dp => selected[dp.key]).map(dp => {
                const Icon = dp.icon;
                return (
                  <div key={dp.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}` }}>
                    <Icon size={15} color={dp.color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{dp.label}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{(dataMap[dp.key] || []).length} records</div>
                    </div>
                  </div>
                );
              })}
              {selectedCount === 0 && <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '20px 0' }}>Select at least one data point to generate a report.</p>}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}