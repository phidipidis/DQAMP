import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilters } from '@/lib/FilterContext';
import { Download, FileText } from 'lucide-react';
import { createDoc, drawReportHeader, drawSummaryStats, drawSectionHeading, drawTable, drawFooter } from '@/lib/pdfReportTemplate';

export default function ARTACSMSummary() {
  const { quarters, divisions } = useFilters();
  const [selectedUnit, setSelectedUnit] = useState('All');
  const [selectedCustomerType, setSelectedCustomerType] = useState('All');

  const { data: feedback = [] } = useQuery({
    queryKey: ['artaFeedback'],
    queryFn: () => base44.entities.ARTAFeedback.list()
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['dqampActivities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const getActivityTitle = (linkedActivity) => {
    const id = typeof linkedActivity === 'object' ? linkedActivity?.id : linkedActivity;
    const match = activities.find(a => a.id === id);
    return match?.Activity_Title || match?.Title || 'Unknown Activity';
  };

  // Filter feedback using global filters + local filters
  const filteredFeedback = feedback.filter(item => {
    if (quarters.length > 0 && !quarters.includes(item.Quarter)) return false;
    if (selectedUnit !== 'All' && item.Operating_Unit !== selectedUnit) return false;
    if (selectedCustomerType !== 'All' && item.Customer_Type !== selectedCustomerType) return false;
    // Division: match via linked activity's division
    if (divisions.length > 0) {
      const actId = typeof item.Linked_Activity === 'object' ? item.Linked_Activity?.id : item.Linked_Activity;
      const act = activities.find(a => a.id === actId);
      if (!act || !divisions.includes(act.Functional_Division)) return false;
    }
    return true;
  });

  const units = [...new Set(feedback.map(f => f.Operating_Unit).filter(Boolean))];

  // Group by activity and calculate statistics
  const activityStats = {};
  filteredFeedback.forEach(item => {
    const rawId = typeof item.Linked_Activity === 'object' ? item.Linked_Activity?.id : item.Linked_Activity;
    const activityId = rawId || 'Unknown';
    if (!activityStats[activityId]) {
      activityStats[activityId] = {
        activity_title: getActivityTitle(item.Linked_Activity),
        total_respondents: 0,
        customer_types: {},
        sqd_scores: []
      };
    }
    activityStats[activityId].total_respondents++;
    const customerKey = item.Customer_Type || 'Unspecified';
    activityStats[activityId].customer_types[customerKey] =
      (activityStats[activityId].customer_types[customerKey] || 0) + 1;

    // Calculate average SQD score for this response (SQD0 excluded — never collected)
    const scores = [
      item.SQD1_Responsiveness,
      item.SQD2_Reliability,
      item.SQD3_Access_Facilities,
      item.SQD4_Communication,
      item.SQD5_Costs,
      item.SQD6_Integrity,
      item.SQD7_Assurance,
      item.SQD8_Outcome
    ].filter(s => s != null);

    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      activityStats[activityId].sqd_scores.push(avg);
    }
  });

  const summaryData = Object.entries(activityStats).map(([activityId, stats]) => ({
    activityId,
    activity_title: stats.activity_title,
    total_respondents: stats.total_respondents,
    customer_breakdown: Object.entries(stats.customer_types)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', '),
    average_sqd_score: stats.sqd_scores.length > 0
      ? (stats.sqd_scores.reduce((a, b) => a + b, 0) / stats.sqd_scores.length).toFixed(2)
      : 'N/A'
  }));

  const scoredItems = summaryData.filter(item => item.average_sqd_score !== 'N/A');
  const totalRespondentsWithScore = scoredItems.reduce((sum, item) => sum + item.total_respondents, 0);
  const overallAvgScore = totalRespondentsWithScore > 0
    ? scoredItems.reduce((sum, item) => sum + parseFloat(item.average_sqd_score) * item.total_respondents, 0) / totalRespondentsWithScore
    : 0;

  const quarterLabel = quarters.length === 0 ? 'AllQuarters' : quarters.join('-');

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Activity Title', 'Total Respondents', 'Customer Type Breakdown', 'Average SQD Score'];
    const rows = summaryData.map(item => [
      item.activity_title,
      item.total_respondents,
      item.customer_breakdown,
      item.average_sqd_score
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ARTA_CSM_Summary_${quarterLabel}_${Date.now()}.csv`;
    link.click();
  };

  // Export summary PDF (all activities)
  const exportToPDF = () => {
    const doc = createDoc('landscape');
    const period = quarters.length === 0 ? 'All Quarters' : quarters.join(', ');
    let y = drawReportHeader(doc, {
      reportTitle: 'ARTA Client Satisfaction Measurement (CSM) Summary',
      reportSubtitle: 'ARTA Memorandum Circular 2022-05',
      reportingPeriod: period,
    });
    y = drawSummaryStats(doc, [
      { label: 'Total Activities',   value: summaryData.length },
      { label: 'Total Respondents',  value: summaryData.reduce((s, i) => s + i.total_respondents, 0) },
      { label: 'Overall Avg SQD',    value: `${overallAvgScore.toFixed(2)} / 5.00` },
      { label: 'Quarter / Period',   value: period },
    ], y);
    y = drawSectionHeading(doc, 'Activity Satisfaction Summary', y);
    const headers = ['Activity Title', 'Respondents', 'Customer Types', 'Avg SQD Score'];
    const colWidths = [120, 25, 80, 35];
    const rows = summaryData.map(item => [
      item.activity_title,
      item.total_respondents,
      item.customer_breakdown,
      item.average_sqd_score
    ]);
    drawTable(doc, headers, rows, y, colWidths, { alignRight: [1, 3] });
    drawFooter(doc, 1);
    doc.save(`ARTA_CSM_Summary_${quarterLabel}_${Date.now()}.pdf`);
  };

  // Export PDF for a single activity
  const exportActivityPDF = (item) => {
    const activityFeedback = filteredFeedback.filter(f => {
      const rawId = typeof f.Linked_Activity === 'object' ? f.Linked_Activity?.id : f.Linked_Activity;
      return rawId === item.activityId;
    });

    const doc = createDoc('portrait');
    const period = quarters.length === 0 ? 'All Quarters' : quarters.join(', ');
    let y = drawReportHeader(doc, {
      reportTitle: 'ARTA CSM – Activity Feedback Report',
      reportSubtitle: 'ARTA MC 2022-05',
      projectName: item.activity_title,
      reportingPeriod: period,
    });
    y = drawSummaryStats(doc, [
      { label: 'Total Respondents',  value: item.total_respondents },
      { label: 'Avg SQD Score',      value: `${item.average_sqd_score} / 5.00` },
      { label: 'Customer Breakdown', value: item.customer_breakdown },
    ], y);

    const sqd_labels = ['SQD1 Responsiveness','SQD2 Reliability','SQD3 Access & Facilities','SQD4 Communication','SQD5 Costs','SQD6 Integrity','SQD7 Assurance','SQD8 Outcome'];
    const sqd_keys   = ['SQD1_Responsiveness','SQD2_Reliability','SQD3_Access_Facilities','SQD4_Communication','SQD5_Costs','SQD6_Integrity','SQD7_Assurance','SQD8_Outcome'];

    y = drawSectionHeading(doc, 'SQD Dimension Averages', y);
    const dimAvgs = sqd_keys.map((key, i) => {
      const vals = activityFeedback.map(f => f[key]).filter(v => v != null);
      const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 'N/A';
      return [sqd_labels[i], avg];
    });
    y = drawTable(doc, ['Dimension', 'Average Score'], dimAvgs, y, [150, 37], { alignRight: [1] });

    if (activityFeedback.length > 0) {
      y = drawSectionHeading(doc, 'Individual Responses', y);
      const respHeaders = ['Customer Type', 'SQD1', 'SQD2', 'SQD3', 'SQD4', 'SQD5', 'SQD6', 'SQD7', 'SQD8', 'Avg'];
      const respRows = activityFeedback.map(f => {
        const scores = sqd_keys.map(k => f[k]).filter(v => v != null);
        const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
        return [f.Customer_Type || '—', ...sqd_keys.map(k => f[k] ?? '—'), avg];
      });
      drawTable(doc, respHeaders, respRows, y, [30, 17, 17, 17, 17, 17, 17, 17, 17, 17], { alignRight: [1,2,3,4,5,6,7,8,9] });
    }

    drawFooter(doc, 1);
    const safeTitle = item.activity_title.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    doc.save(`ARTA_CSM_${safeTitle}_${Date.now()}.pdf`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1e3a5f]">ARTA CSM Summary</h1>
        <p className="text-slate-600 mt-2">Client Satisfaction Measurement based on ARTA MC 2022-05</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Operating Unit</label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Units</SelectItem>
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Customer Type</label>
              <Select value={selectedCustomerType} onValueChange={setSelectedCustomerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Citizen">Citizen</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={exportToCSV} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={exportToPDF} className="flex-1 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Activities</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">{summaryData.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Respondents</p>
            <p className="text-2xl font-bold text-[#0d9488]">
              {summaryData.reduce((sum, item) => sum + item.total_respondents, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Average SQD Score</p>
            <p className="text-2xl font-bold text-slate-900">{overallAvgScore.toFixed(2)} / 5.00</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="py-3 px-4 text-left text-sm font-semibold">Activity Title</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Total Respondents</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Customer Type Breakdown</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Average SQD Score</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Export</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-center text-sm text-slate-400">
                      No data found for selected filters.
                    </td>
                  </tr>
                ) : summaryData.map((item) => (
                <tr key={item.activityId} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">{item.activity_title}</td>
                  <td className="py-3 px-4 text-sm">{item.total_respondents}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{item.customer_breakdown}</td>
                  <td className="py-3 px-4 text-sm font-medium">
                    <span className={`${
                      item.average_sqd_score === 'N/A' ? 'text-slate-400' :
                      parseFloat(item.average_sqd_score) >= 4 ? 'text-emerald-600' :
                      parseFloat(item.average_sqd_score) >= 3 ? 'text-blue-600' :
                      parseFloat(item.average_sqd_score) >= 2 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {item.average_sqd_score}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportActivityPDF(item)}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      PDF
                    </Button>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}