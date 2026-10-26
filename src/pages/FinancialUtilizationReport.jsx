import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, FileText } from 'lucide-react';
import { createDoc, drawReportHeader, drawSummaryStats, drawSectionHeading, drawTable, drawFooter } from '@/lib/pdfReportTemplate';
import {
  C, FONT, PageHeader, FilterToolbar, FilterLabel, FilterDivider, SegBtn,
  ClearFiltersButton, DashboardPanel, KPIBand, KPITile, DashboardTable
} from '@/components/ui/DashboardSystem';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const DIVISIONS = ['CID', 'SGOD', 'OSDS'];

export default function FinancialUtilizationReport() {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedQuarter, setSelectedQuarter] = useState('All');
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [selectedSaro, setSelectedSaro] = useState('All');

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  // Filter activities — use Start_Date with fallback to Planned_Start_Date (unchanged)
  const filteredActivities = activities.filter(activity => {
    if (selectedDivision !== 'All' && activity.Functional_Division !== selectedDivision) return false;
    if (selectedSaro !== 'All' && activity.saro_number !== selectedSaro) return false;
    const dateStr = activity.Start_Date || activity.Planned_Start_Date;
    if (dateStr) {
      const year = new Date(dateStr).getFullYear().toString();
      if (year !== selectedYear) return false;
      if (selectedQuarter !== 'All') {
        const month = new Date(dateStr).getMonth();
        const quarter = `Q${Math.floor(month / 3) + 1}`;
        if (quarter !== selectedQuarter) return false;
      }
    } else {
      return false;
    }
    return true;
  });

  const saroNumbers = [...new Set(activities.map(a => a.saro_number).filter(Boolean))];

  // Calculate totals (unchanged)
  const totals = filteredActivities.reduce((acc, activity) => {
    const allocation = activity.Financial_Allocation || 0;
    const utilization = activity.Financial_Utilization || 0;
    return {
      allocation: acc.allocation + allocation,
      utilization: acc.utilization + utilization,
      variance: acc.variance + (allocation - utilization)
    };
  }, { allocation: 0, utilization: 0, variance: 0 });

  const utilizationRate = totals.allocation > 0 ? (totals.utilization / totals.allocation) * 100 : 0;
  const overspentActivities = filteredActivities.filter(a =>
    (a.Financial_Utilization || 0) > (a.Financial_Allocation || 0)
  );

  // Export to CSV (unchanged)
  const exportToCSV = () => {
    const headers = ['Division', 'Project Name', 'Activity Title', 'Funding Source', 'Financial Allocation', 'Financial Utilization', 'Variance', 'Utilization Rate (%)'];
    const rows = filteredActivities.map(activity => {
      const project = projects.find(p => p.Linked_Activities?.includes(activity.id) || activity.Linked_Projects?.includes(p.id));
      const allocation = activity.Financial_Allocation || 0;
      const utilization = activity.Financial_Utilization || 0;
      const variance = allocation - utilization;
      const rate = allocation > 0 ? ((utilization / allocation) * 100).toFixed(2) : 0;
      return [activity.Functional_Division || '', project?.Project_Title || '', activity.Activity_Title || '', activity.Funding_Source || project?.Funding_Source || '', allocation, utilization, variance, rate];
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Financial_Report_${selectedYear}_Q${selectedQuarter}_${Date.now()}.csv`;
    link.click();
  };

  // Export to PDF (unchanged)
  const exportToPDF = () => {
    const doc = createDoc('landscape');
    const period = `${selectedQuarter === 'All' ? 'All Quarters' : selectedQuarter} ${selectedYear}`;
    let y = drawReportHeader(doc, {
      reportTitle: 'Financial Utilization Report',
      reportSubtitle: 'Budget Allocation & Variance Analysis',
      reportingPeriod: period,
    });
    y = drawSummaryStats(doc, [
      { label: 'Total Allocation',  value: `₱${totals.allocation.toLocaleString()}` },
      { label: 'Total Utilization', value: `₱${totals.utilization.toLocaleString()}` },
      { label: 'Variance',          value: `₱${totals.variance.toLocaleString()}` },
      { label: 'Utilization Rate',  value: `${utilizationRate.toFixed(1)}%` },
    ], y);
    y = drawSectionHeading(doc, 'Activity Financial Details', y);
    const headers = ['Division', 'Activity Title', 'Funding Source', 'Allocation (₱)', 'Utilization (₱)', 'Variance (₱)', 'Rate (%)'];
    const colWidths = [22, 90, 24, 32, 32, 32, 22];
    const rows = filteredActivities.map(activity => {
      const allocation  = activity.Financial_Allocation  || 0;
      const utilization = activity.Financial_Utilization || 0;
      const variance    = allocation - utilization;
      const rate        = allocation > 0 ? ((utilization / allocation) * 100).toFixed(1) : '0.0';
      return [activity.Functional_Division || '', activity.Activity_Title || '', activity.Funding_Source || '', allocation.toLocaleString(), utilization.toLocaleString(), variance.toLocaleString(), `${rate}%`];
    });
    drawTable(doc, headers, rows, y, colWidths, { alignRight: [3, 4, 5, 6] });
    drawFooter(doc, 1);
    doc.save(`Financial_Report_${selectedYear}_${selectedQuarter}_${Date.now()}.pdf`);
  };

  const selectStyle = {
    border: `1px solid ${C.border}`, borderRadius: 6,
    padding: '5px 10px', fontSize: 13, fontWeight: 500,
    color: C.neutral, background: C.surface,
    outline: 'none', cursor: 'pointer', fontFamily: FONT,
  };

  const exportBtnStyle = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: FONT,
    transition: 'opacity 0.13s',
  };

  const hasActiveFilters = selectedYear !== '2026' || selectedQuarter !== 'All' || selectedDivision !== 'All' || selectedSaro !== 'All';

  const clearAll = () => {
    setSelectedYear('2026');
    setSelectedQuarter('All');
    setSelectedDivision('All');
    setSelectedSaro('All');
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Financial Utilization Report"
        subtitle="Budget allocation, utilization, and variance analysis"
        actions={
          <>
            <button onClick={exportToCSV} style={{ ...exportBtnStyle, background: C.surface, color: C.neutral, border: `1px solid ${C.border}` }}>
              <Download size={14} /> CSV
            </button>
            <button onClick={exportToPDF} style={{ ...exportBtnStyle, background: C.brand, color: C.surface }}>
              <FileText size={14} /> PDF
            </button>
          </>
        }
      />

      {/* Filter toolbar */}
      <FilterToolbar>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FilterLabel>Year</FilterLabel>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={selectStyle}>
            {['2024','2025','2026','2027'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <FilterDivider />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FilterLabel>Quarter</FilterLabel>
          <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 3, gap: 2 }}>
            <SegBtn label="All" active={selectedQuarter === 'All'} onClick={() => setSelectedQuarter('All')} />
            {QUARTERS.map(q => (
              <SegBtn key={q} label={q} active={selectedQuarter === q} onClick={() => setSelectedQuarter(q)} />
            ))}
          </div>
        </div>
        <FilterDivider />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FilterLabel>Division</FilterLabel>
          <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 3, gap: 2 }}>
            <SegBtn label="All" active={selectedDivision === 'All'} onClick={() => setSelectedDivision('All')} />
            {DIVISIONS.map(d => (
              <SegBtn key={d} label={d} active={selectedDivision === d} onClick={() => setSelectedDivision(d)} />
            ))}
          </div>
        </div>
        <FilterDivider />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FilterLabel>SARO</FilterLabel>
          <select value={selectedSaro} onChange={e => setSelectedSaro(e.target.value)} style={selectStyle}>
            <option value="All">All SARO numbers</option>
            {saroNumbers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {hasActiveFilters && (
          <>
            <FilterDivider />
            <ClearFiltersButton onClick={clearAll} />
          </>
        )}
      </FilterToolbar>

      {/* KPI Band */}
      <KPIBand>
        <KPITile label="Total allocation"  value={`₱${totals.allocation.toLocaleString()}`}  icon={FileText} borderLeft={C.brand}      />
        <KPITile label="Total utilization" value={`₱${totals.utilization.toLocaleString()}`} icon={FileText} borderLeft={C.successBar} />
        <KPITile label="Variance"          value={`₱${totals.variance.toLocaleString()}`}    icon={FileText} borderLeft={totals.variance < 0 ? C.dangerBar : C.accent} />
        <KPITile label="Utilization rate"  value={`${utilizationRate.toFixed(1)}%`}           icon={FileText} borderLeft={utilizationRate > 100 ? C.dangerBar : C.brand} />
      </KPIBand>

      {/* Overspent alert */}
      {overspentActivities.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderRadius: 8,
          background: C.dangerSoft, border: `1px solid ${C.dangerBar}22`,
          fontFamily: FONT,
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.danger }}>
            {overspentActivities.length} overspent {overspentActivities.length === 1 ? 'activity' : 'activities'} detected
          </span>
        </div>
      )}

      {/* Data Table */}
      <DashboardPanel title={`Financial details (${filteredActivities.length} activities)`} noPad>
        <DashboardTable
          headers={[
            { label: 'Division' }, { label: 'Activity' }, { label: 'Funding' },
            { label: 'Allocation', align: 'right' }, { label: 'Utilization', align: 'right' },
            { label: 'Variance', align: 'right' }, { label: 'Rate', align: 'right' },
          ]}
          rows={filteredActivities}
          emptyMessage="No activities match the selected filters."
          renderRow={(activity, i) => {
            const allocation = activity.Financial_Allocation || 0;
            const utilization = activity.Financial_Utilization || 0;
            const variance = allocation - utilization;
            const rate = allocation > 0 ? ((utilization / allocation) * 100).toFixed(1) : 0;
            const isOverspent = variance < 0;
            return (
              <tr key={activity.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 400, color: C.muted }}>{activity.Functional_Division}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text }}>{activity.Activity_Title}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 400, color: C.muted }}>{activity.Funding_Source}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>₱{allocation.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>₱{utilization.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: isOverspent ? C.danger : C.text, textAlign: 'right' }}>₱{variance.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: rate > 100 ? C.danger : C.text, textAlign: 'right' }}>{rate}%</td>
              </tr>
            );
          }}
        />
      </DashboardPanel>
    </div>
  );
}