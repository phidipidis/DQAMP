import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilters } from '@/lib/FilterContext';
import { Download, FileText } from 'lucide-react';
import { createDoc, drawReportHeader, drawSummaryStats, drawSectionHeading, drawTable, drawFooter } from '@/lib/pdfReportTemplate';

export default function PIRPAReport() {
  const { quarters, divisions } = useFilters();
  const [selectedYear, setSelectedYear] = useState('2026');

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  // Filter activities using global filters + year
  const filteredActivities = activities.filter(activity => {
    if (!activity.Date_Conducted && !activity.Start_Date) return false;
    const dateStr = activity.Date_Conducted || activity.Start_Date;
    const activityDate = new Date(dateStr);
    if (activityDate.getFullYear().toString() !== selectedYear) return false;
    if (divisions.length > 0 && !divisions.includes(activity.Functional_Division)) return false;
    if (quarters.length > 0) {
      const q = `Q${Math.floor(activityDate.getMonth() / 3) + 1}`;
      if (!quarters.includes(q)) return false;
    }
    return true;
  });

  // Get unique divisions
  const allDivisions = [...new Set(activities.map(a => a.Functional_Division).filter(Boolean))];

  // Calculate totals
  const totals = filteredActivities.reduce((acc, activity) => ({
    allocation: acc.allocation + (activity.Financial_Allocation || 0),
    utilization: acc.utilization + (activity.Financial_Utilization || 0),
    variance: acc.variance + ((activity.Financial_Allocation || 0) - (activity.Financial_Utilization || 0))
  }), { allocation: 0, utilization: 0, variance: 0 });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Division', 'Activity Title', 'Date Conducted', 'Remarks', 'Reschedule Reason', 'Financial Allocation', 'Financial Utilization', 'Variance'];
    const rows = filteredActivities.map(activity => [
      activity.Functional_Division || '',
      activity.Activity_Title || '',
      activity.Date_Conducted || activity.Start_Date || '',
      activity.Remarks || '',
      activity.Reschedule_Reason || '',
      activity.Financial_Allocation || 0,
      activity.Financial_Utilization || 0,
      (activity.Financial_Allocation || 0) - (activity.Financial_Utilization || 0)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PIRPA_Report_${selectedYear}_${quarters.length === 0 ? 'All' : quarters.join('-')}_${Date.now()}.csv`;
    link.click();
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = createDoc('landscape');
    const period = `${quarters.length > 0 ? quarters.join(', ') : 'All Quarters'} ${selectedYear}`;
    const utilizationRate = totals.allocation > 0 ? ((totals.utilization / totals.allocation) * 100).toFixed(1) : '0.0';
    let y = drawReportHeader(doc, {
      reportTitle: 'Program Implementation Review and Plan Adjustment (PIRPA) Report',
      reportSubtitle: 'DQAMP Monitoring System',
      reportingPeriod: period,
    });
    y = drawSummaryStats(doc, [
      { label: 'Total Activities',  value: filteredActivities.length },
      { label: 'Total Allocation',  value: `₱${totals.allocation.toLocaleString()}` },
      { label: 'Total Utilization', value: `₱${totals.utilization.toLocaleString()}` },
      { label: 'Utilization Rate',  value: `${utilizationRate}%` },
    ], y);
    y = drawSectionHeading(doc, 'Activity Financial Summary', y);
    const headers = ['Division', 'Activity Title', 'Date Conducted', 'Allocation (PHP)', 'Utilization (PHP)', 'Variance (PHP)', 'Remarks'];
    const colWidths = [22, 78, 26, 32, 32, 32, 64];
    const rows = filteredActivities.map(a => {
      const variance = (a.Financial_Allocation || 0) - (a.Financial_Utilization || 0);
      return [
        a.Functional_Division || '',
        a.Activity_Title || '',
        a.Date_Conducted || a.Start_Date || '',
        (a.Financial_Allocation || 0).toLocaleString(),
        (a.Financial_Utilization || 0).toLocaleString(),
        variance.toLocaleString(),
        a.Remarks || ''
      ];
    });
    drawTable(doc, headers, rows, y, colWidths, { alignRight: [3, 4, 5] });
    drawFooter(doc, 1);
    doc.save(`PIRPA_Report_${selectedYear}_${quarters.length === 0 ? 'All' : quarters.join('-')}_${Date.now()}.pdf`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1B2A8F]">PIRPA Report</h1>
        <p className="text-slate-600 mt-2">Program Implementation Review and Plan Adjustment</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={exportToCSV} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={exportToPDF} className="flex-1 bg-[#1B2A8F] hover:bg-[#1B2A8F]/90">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Allocation</p>
            <p className="text-2xl font-bold text-[#1B2A8F]">₱{totals.allocation.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Utilization</p>
            <p className="text-2xl font-bold text-[#1B2A8F]">₱{totals.utilization.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Variance</p>
            <p className={`text-2xl font-bold ${totals.variance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
              ₱{totals.variance.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activities ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="py-3 px-4 text-left text-sm font-semibold">Division</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Activity Title</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Date Conducted</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Allocation</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Utilization</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Variance</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map(activity => {
                  const variance = (activity.Financial_Allocation || 0) - (activity.Financial_Utilization || 0);
                  return (
                    <tr key={activity.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm">{activity.Functional_Division}</td>
                      <td className="py-3 px-4 text-sm">{activity.Activity_Title}</td>
                      <td className="py-3 px-4 text-sm">{activity.Date_Conducted || activity.Start_Date}</td>
                      <td className="py-3 px-4 text-sm">₱{(activity.Financial_Allocation || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm">₱{(activity.Financial_Utilization || 0).toLocaleString()}</td>
                      <td className={`py-3 px-4 text-sm font-medium ${variance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        ₱{variance.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}