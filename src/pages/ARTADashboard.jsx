import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquareText, Users, Building2, ThumbsUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardFilters from '../components/ui/DashboardFilters';
import {
  C, FONT, PageHeader, DashboardPanel, KPIBand, KPITile,
  DashboardTable, chartTickSmall, chartTooltipStyle, chartGridStroke
} from '@/components/ui/DashboardSystem';

const COLORS = [C.brand, C.accent, C.warningBar, C.successBar, C.dangerBar];

export default function ARTADashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState('All');
  const [division, setDivision] = useState('All');
  const [projectId, setProjectId] = useState('All');

  const { data: feedback = [] } = useQuery({ queryKey: ['feedback'], queryFn: () => base44.entities.ARTAFeedback.list() });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });

  // Filter feedback based on linked activities (unchanged)
  const filteredFeedback = feedback.filter(fb => {
    const activity = activities.find(a => a.id === fb.Linked_Activity);
    if (!activity) return false;
    if (division !== 'All' && activity.Functional_Division !== division) return false;
    if (projectId !== 'All' && activity.Linked_Project !== projectId) return false;
    if (year !== 'All' && fb.created_date) {
      const fbYear = new Date(fb.created_date).getFullYear();
      if (fbYear !== year) return false;
    }
    if (quarter !== 'All' && fb.created_date) {
      const fbMonth = new Date(fb.created_date).getMonth();
      const fbQuarter = `Q${Math.floor(fbMonth / 3) + 1}`;
      if (fbQuarter !== quarter) return false;
    }
    return true;
  });

  // Stats (unchanged)
  const totalResponses = filteredFeedback.length;
  const byCustomerType = {
    Citizen: filteredFeedback.filter(f => f.Customer_Type === 'Citizen').length,
    Business: filteredFeedback.filter(f => f.Customer_Type === 'Business').length,
    Government: filteredFeedback.filter(f => f.Customer_Type === 'Government').length
  };

  const cc1Data = [
    { name: 'Aware before transaction', value: filteredFeedback.filter(f => f.CC1 === 'Aware before transaction').length },
    { name: 'Aware upon seeing CC', value: filteredFeedback.filter(f => f.CC1 === 'Aware only upon seeing CC').length },
    { name: 'Not aware', value: filteredFeedback.filter(f => f.CC1 === 'Not aware').length }
  ].filter(d => d.value > 0);

  const sqdFields = [
    { key: 'SQD1_Responsiveness', label: 'Responsiveness' },
    { key: 'SQD2_Reliability', label: 'Reliability' },
    { key: 'SQD3_Access_Facilities', label: 'Access/Facilities' },
    { key: 'SQD4_Communication', label: 'Communication' },
    { key: 'SQD5_Costs', label: 'Costs' },
    { key: 'SQD6_Integrity', label: 'Integrity' },
    { key: 'SQD7_Assurance', label: 'Assurance' },
    { key: 'SQD8_Outcome', label: 'Outcome' }
  ];

  const sqdRatingCounts = sqdFields.map(sqd => {
    const counts = { dimension: sqd.label, rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0 };
    filteredFeedback.forEach(fb => {
      const rating = fb[sqd.key];
      if (rating >= 1 && rating <= 5) counts[`rating_${rating}`]++;
    });
    return counts;
  });

  const customerTypeData = Object.entries(byCustomerType)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({ name: type, value: count }));

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="ARTA Dashboard" subtitle="Customer Satisfaction Measurement analysis" />

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Governance:</strong> This dashboard displays raw feedback counts and distributions only.
          No sentiment analysis, normalization, averaging, or composite scoring is performed.
        </AlertDescription>
      </Alert>

      <DashboardFilters
        year={year} setYear={setYear}
        quarter={quarter} setQuarter={setQuarter}
        division={division} setDivision={setDivision}
        projectId={projectId} setProjectId={setProjectId}
        projects={projects}
      />

      {/* KPI Band */}
      <KPIBand>
        <KPITile label="Total responses" value={totalResponses}            icon={MessageSquareText} borderLeft={C.brand}      />
        <KPITile label="Citizens"        value={byCustomerType.Citizen}     icon={Users}             borderLeft={C.accent}     />
        <KPITile label="Business"        value={byCustomerType.Business}    icon={Building2}         borderLeft={C.warningBar} />
        <KPITile label="Government"      value={byCustomerType.Government}  icon={ThumbsUp}          borderLeft={C.successBar} />
      </KPIBand>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <DashboardPanel title="CC1: Citizen's Charter awareness" noPad>
          <div style={{ height: 260, padding: '16px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cc1Data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} outerRadius={90} dataKey="value" style={{ fontSize: 13, fontFamily: FONT }}>
                  {cc1Data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: FONT }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel title="By customer type" noPad>
          <div style={{ height: 260, padding: '16px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={customerTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={90} dataKey="value" style={{ fontSize: 13, fontFamily: FONT }}>
                  {customerTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>
      </div>

      {/* SQD Rating Distribution */}
      <DashboardPanel title="Service quality dimensions — rating distribution (counts)" noPad>
        <div style={{ height: 360, padding: '16px 0 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sqdRatingCounts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
              <XAxis type="number" tick={chartTickSmall} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="dimension" width={110} tick={chartTickSmall} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: FONT }} />
              <Bar dataKey="rating_1" stackId="a" fill={C.dangerBar}  name="Rating 1" />
              <Bar dataKey="rating_2" stackId="a" fill="#F97316"       name="Rating 2" />
              <Bar dataKey="rating_3" stackId="a" fill={C.warningBar}  name="Rating 3" />
              <Bar dataKey="rating_4" stackId="a" fill="#84CC16"       name="Rating 4" />
              <Bar dataKey="rating_5" stackId="a" fill={C.successBar}  name="Rating 5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardPanel>

      {/* SQD Counts Table */}
      <DashboardPanel title="SQD rating counts (raw data)" noPad>
        <DashboardTable
          headers={[
            { label: 'Dimension' },
            { label: 'Rating 1', align: 'right' },
            { label: 'Rating 2', align: 'right' },
            { label: 'Rating 3', align: 'right' },
            { label: 'Rating 4', align: 'right' },
            { label: 'Rating 5', align: 'right' },
            { label: 'Total', align: 'right' },
          ]}
          rows={sqdRatingCounts}
          renderRow={(row, i) => (
            <tr key={row.dimension} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text }}>{row.dimension}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 400, color: C.muted, textAlign: 'right' }}>{row.rating_1}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 400, color: C.muted, textAlign: 'right' }}>{row.rating_2}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 400, color: C.muted, textAlign: 'right' }}>{row.rating_3}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 400, color: C.muted, textAlign: 'right' }}>{row.rating_4}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 400, color: C.muted, textAlign: 'right' }}>{row.rating_5}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>
                {row.rating_1 + row.rating_2 + row.rating_3 + row.rating_4 + row.rating_5}
              </td>
            </tr>
          )}
        />
      </DashboardPanel>
    </div>
  );
}