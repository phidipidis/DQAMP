import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DIVISIONS = ['CID', 'SGOD', 'OSDS'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

function getQuarter(dateStr) {
  if (!dateStr) return null;
  const month = new Date(dateStr).getMonth(); // 0-indexed
  return `Q${Math.floor(month / 3) + 1}`;
}

function formatDate(dateStr) {
  if (!dateStr || isNaN(new Date(dateStr).getTime())) return '—';
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function QAMEToolsReport() {
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [quarterFilter, setQuarterFilter] = useState('All');
  const [qameFormFilter, setQameFormFilter] = useState('All');

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const filteredActivities = activities
    .filter(activity => {
      if (divisionFilter !== 'All' && activity.Functional_Division !== divisionFilter) return false;
      if (projectFilter !== 'All') {
        const proj = projects.find(p => p.id === projectFilter);
        const linked = activity.Linked_Projects?.includes(projectFilter) || proj?.Linked_Activities?.includes(activity.id);
        if (!linked) return false;
      }
      if (quarterFilter !== 'All' && getQuarter(activity.Planned_Start_Date) !== quarterFilter) return false;
      if (qameFormFilter === 'Yes' && !(activity.needs_qame_eval_form ?? true)) return false;
      if (qameFormFilter === 'No' && (activity.needs_qame_eval_form ?? true)) return false;
      return true;
    })
    .sort((a, b) => {
      const da = a.Planned_Start_Date || '';
      const db = b.Planned_Start_Date || '';
      return da.localeCompare(db);
    });

  const exportToCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const headers = ['No.', 'ACTIVITIES', 'DATE OF ACTIVITY', 'LINK FOR MONITORING TOOL'];
    const rows = filteredActivities.map((activity, idx) => [
      idx + 1,
      activity.Activity_Title || '',
      formatDate(activity.Planned_Start_Date),
      activity.QAME_Evaluation_Form_URL || ''
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `QAME_Tools_Report_${today}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">QAME Tools Report</h1>
        <p className="text-slate-600 mt-1">Quality Assurance Monitoring and Evaluation Tools</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[160px]">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Filter by Division</label>
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Divisions</SelectItem>
                  {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[200px]">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Filter by Project</label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Projects</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.Project_Code} – {p.Project_Title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Filter by Quarter</label>
              <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Quarters</SelectItem>
                  {QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <label className="text-xs font-medium text-slate-600 mb-1 block">QAME Evaluation Form</label>
              <Select value={qameFormFilter} onValueChange={setQameFormFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Activities</SelectItem>
                  <SelectItem value="Yes">Requires Form</SelectItem>
                  <SelectItem value="No">No Form Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />Download as CSV
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="py-3 px-4 text-left text-sm font-bold">NO.</th>
                  <th className="py-3 px-4 text-left text-sm font-bold">ACTIVITIES</th>
                  <th className="py-3 px-4 text-left text-sm font-bold">DATE OF ACTIVITY</th>
                  <th className="py-3 px-4 text-left text-sm font-bold">LINK FOR MONITORING TOOL</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No activities match the selected filters.</td></tr>
                ) : (
                  filteredActivities.map((activity, idx) => (
                    <tr key={activity.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 text-sm font-medium">{activity.Activity_Title || '—'}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(activity.Planned_Start_Date)}</td>
                      <td className="py-3 px-4 text-sm">
                        {activity.QAME_Evaluation_Form_URL ? (
                         <a
                           href={activity.QAME_Evaluation_Form_URL}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-blue-600 hover:underline break-all"
                         >
                           {activity.QAME_Evaluation_Form_URL}
                         </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}