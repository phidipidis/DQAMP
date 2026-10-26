import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilters } from '@/lib/FilterContext';
import { Badge } from '@/components/ui/badge';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

function drawPDFTable(doc, headers, rows, startY, colWidths) {
  const margin = 14;
  const rowHeight = 8;
  let y = startY;
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  let x = margin;
  headers.forEach((h, i) => {
    doc.rect(x, y, colWidths[i], rowHeight);
    doc.text(String(h), x + 1, y + 5, { maxWidth: colWidths[i] - 2 });
    x += colWidths[i];
  });
  y += rowHeight;
  doc.setFont(undefined, 'normal');
  rows.forEach(row => {
    if (y + rowHeight > doc.internal.pageSize.getHeight() - 14) {
      doc.addPage();
      y = 20;
    }
    let x = margin;
    row.forEach((cell, i) => {
      doc.rect(x, y, colWidths[i], rowHeight);
      doc.text(doc.splitTextToSize(String(cell ?? ''), colWidths[i] - 2), x + 1, y + 4);
      x += colWidths[i];
    });
    y += rowHeight;
  });
  return y;
}

export default function ConsolidatedQAMEReport() {
  const { matchesFilters, quarters } = useFilters();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [qameFilter, setQameFilter] = useState('rated');

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  // Filter activities by QAME status, category, and global filters
  const filteredActivities = activities.filter(activity => {
    const hasRating = activity.QAME_Rating && activity.QAME_Rating !== 'Not Rated';
    if (qameFilter === 'rated' && !hasRating) return false;
    if (qameFilter === 'missing' && hasRating) return false;
    if (selectedCategory !== 'All' && activity.Activity_Type !== selectedCategory) return false;
    if (!matchesFilters(activity, 'Date_Conducted')) return false;
    return true;
  });

  const categories = [...new Set(activities.map(a => a.Activity_Type).filter(Boolean))];
  const divisions = ['CID', 'SGOD', 'OSDS'];

  // Calculate statistics
  const ratingCounts = filteredActivities.reduce((acc, activity) => {
    acc[activity.QAME_Rating] = (acc[activity.QAME_Rating] || 0) + 1;
    return acc;
  }, {});

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Activity Title', 'Category', 'Date Conducted', 'Venue', 'QAME Rating', 'Venue Rating', 'QAME Assessor', 'Remarks for Improvement'];
    const rows = filteredActivities.map(activity => [
      activity.Activity_Title || '',
      activity.Activity_Type || activity.Category || '',
      activity.Date_Conducted || '',
      activity.Venue || '',
      activity.QAME_Rating || '',
      activity.QAME_Venue_Rating || '',
      activity.QAME_Assessor || '',
      activity.Remarks_For_Improvement || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `QAME_Report_${quarters.length === 0 ? 'AllQuarters' : quarters.join('-')}_${Date.now()}.csv`;
    link.click();
  };

  // Export to PDF
  const exportToPDF = () => {
    const quarterLabel = quarters.length === 0 ? 'AllQuarters' : quarters.join('-');
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('Quality Assurance Monitoring and Evaluation (QAME) Report', 14, 16);
    doc.setFontSize(8);
    doc.text(`Quarter: ${quarters.length === 0 ? 'All Quarters' : quarters.join(', ')}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 23);
    doc.text(`Total Assessed: ${filteredActivities.length}  |  Outstanding: ${ratingCounts['Outstanding'] || 0}  |  Very Satisfactory: ${ratingCounts['Very Satisfactory'] || 0}  |  Satisfactory: ${ratingCounts['Satisfactory'] || 0}  |  Needs Improvement: ${ratingCounts['Needs Improvement'] || 0}`, 14, 29);

    const headers = ['Activity Title', 'Category', 'Date Conducted', 'Venue', 'QAME Rating', 'Venue Rating', 'Assessor', 'Remarks for Improvement'];
    const colWidths = [64, 24, 22, 34, 28, 26, 30, 58];
    const rows = filteredActivities.map(a => [
      a.Activity_Title || '',
      a.Activity_Type || a.Category || '',
      a.Date_Conducted || '',
      a.Venue || '',
      a.QAME_Rating || '',
      a.QAME_Venue_Rating || '',
      a.QAME_Assessor || '',
      a.Remarks_For_Improvement || ''
    ]);
    drawPDFTable(doc, headers, rows, 36, colWidths);
    doc.save(`QAME_Report_${quarterLabel}_${Date.now()}.pdf`);
  };

  const ratingColors = {
    'Outstanding': 'bg-emerald-100 text-emerald-800',
    'Very Satisfactory': 'bg-blue-100 text-blue-800',
    'Satisfactory': 'bg-yellow-100 text-yellow-800',
    'Needs Improvement': 'bg-red-100 text-red-800'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1e3a5f]">Consolidated QAME Report</h1>
        <p className="text-slate-600 mt-2">Quality Assurance Monitoring and Evaluation</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">QAME Status</label>
              <Select value={qameFilter} onValueChange={setQameFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rated">Has QAME Rating</SelectItem>
                  <SelectItem value="missing">Missing QAME Rating</SelectItem>
                  <SelectItem value="all">All Activities</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3 md:col-span-2">
              <Button onClick={exportToCSV} variant="outline" className="flex-1 h-10">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={exportToPDF} variant="primary" className="flex-1 h-10">
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Assessed</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">{filteredActivities.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Outstanding</p>
            <p className="text-2xl font-bold text-emerald-600">{ratingCounts['Outstanding'] || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Very Satisfactory</p>
            <p className="text-2xl font-bold text-blue-600">{ratingCounts['Very Satisfactory'] || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Satisfactory</p>
            <p className="text-2xl font-bold text-yellow-600">{ratingCounts['Satisfactory'] || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Needs Improvement</p>
            <p className="text-2xl font-bold text-red-600">{ratingCounts['Needs Improvement'] || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>QAME Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="py-3 px-4 text-left text-sm font-semibold">Activity Title</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Category</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Date Conducted</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Venue</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">QAME Rating</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Venue Rating</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Assessor</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map(activity => (
                  <tr key={activity.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm">{activity.Activity_Title}</td>
                    <td className="py-3 px-4 text-sm">{activity.Activity_Type || activity.Category}</td>
                    <td className="py-3 px-4 text-sm">{activity.Date_Conducted}</td>
                    <td className="py-3 px-4 text-sm">{activity.Venue || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge className={ratingColors[activity.QAME_Rating] || 'bg-gray-100 text-gray-800'}>
                        {activity.QAME_Rating || 'Not Rated'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">{activity.QAME_Venue_Rating || '-'}</td>
                    <td className="py-3 px-4 text-sm">{activity.QAME_Assessor || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{activity.Remarks_For_Improvement || '-'}</td>
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