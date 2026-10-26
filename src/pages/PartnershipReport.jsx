import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Handshake, Download, Search, ArrowLeft, Building2, FolderKanban } from 'lucide-react';

const DIVISIONS = ['All', 'CID', 'SGOD', 'OSDS'];

export default function PartnershipReport() {
  const [search, setSearch]         = useState('');
  const [divisionFilter, setDivision] = useState('All');
  const [projectFilter, setProject]   = useState('All');

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities-partnership'],
    queryFn: () => base44.entities.DQAMPActivity.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  // Only activities where has_partnership === true
  const partnershipActivities = useMemo(() =>
    activities.filter(a => a.has_partnership === true),
    [activities]
  );

  const filtered = useMemo(() => {
    return partnershipActivities.filter(a => {
      const title = (a.Activity_Title || a.Title || '').toLowerCase();
      const agency = (a.partner_agency_name || '').toLowerCase();
      const matchSearch = !search || title.includes(search.toLowerCase()) || agency.includes(search.toLowerCase());
      const matchDiv = divisionFilter === 'All' || a.Functional_Division === divisionFilter;
      const matchProject = projectFilter === 'All' ||
        (Array.isArray(a.Linked_Projects) ? a.Linked_Projects.includes(projectFilter) : a.Linked_Project === projectFilter);
      return matchSearch && matchDiv && matchProject;
    });
  }, [partnershipActivities, search, divisionFilter, projectFilter]);

  // Summary stats
  const totalWithPartnership = partnershipActivities.length;
  const totalActivities = activities.length;
  const partnershipRate = totalActivities > 0
    ? ((totalWithPartnership / totalActivities) * 100).toFixed(1)
    : 0;

  // By division
  const byDivision = useMemo(() => {
    const divs = {};
    partnershipActivities.forEach(a => {
      const d = a.Functional_Division || 'Unknown';
      divs[d] = (divs[d] || 0) + 1;
    });
    return divs;
  }, [partnershipActivities]);

  // By project
  const byProject = useMemo(() => {
    const map = {};
    partnershipActivities.forEach(a => {
      const ids = Array.isArray(a.Linked_Projects) ? a.Linked_Projects : (a.Linked_Project ? [a.Linked_Project] : []);
      ids.forEach(pid => {
        map[pid] = (map[pid] || 0) + 1;
      });
    });
    return map;
  }, [partnershipActivities]);

  const getProjectLabel = (id) => {
    const p = projects.find(p => p.id === id);
    return p ? `${p.Project_Code} - ${p.Project_Title}` : id;
  };

  const getActivityProjects = (activity) => {
    const ids = Array.isArray(activity.Linked_Projects)
      ? activity.Linked_Projects
      : (activity.Linked_Project ? [activity.Linked_Project] : []);
    if (ids.length === 0) return <span className="text-slate-400 text-xs">—</span>;
    return ids.map(id => {
      const p = projects.find(p => p.id === id);
      return p ? (
        <Badge key={id} variant="outline" className="text-xs mr-1 mb-0.5">{p.Project_Code}</Badge>
      ) : null;
    });
  };

  const handleExportCSV = () => {
    const headers = ['Activity Title', 'Division', 'Partner Agency', 'Partnership Types', 'Status', 'Date Conducted', 'Projects'];
    const rows = filtered.map(a => {
      const ids = Array.isArray(a.Linked_Projects) ? a.Linked_Projects : (a.Linked_Project ? [a.Linked_Project] : []);
      const projLabels = ids.map(id => {
        const p = projects.find(p => p.id === id);
        return p ? p.Project_Code : id;
      }).join('; ');
      const types = Array.isArray(a.partnership_type) ? a.partnership_type.join('; ') : (a.partnership_type || '');
      return [
        `"${(a.Activity_Title || a.Title || '').replace(/"/g, '""')}"`,
        a.Functional_Division || '',
        `"${(a.partner_agency_name || '').replace(/"/g, '""')}"`,
        `"${types.replace(/"/g, '""')}"`,
        a.Status || '',
        a.Date_Conducted || '',
        `"${projLabels}"`,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'partnership_report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const divisionColors = {
    CID: 'bg-blue-100 text-blue-700',
    SGOD: 'bg-emerald-100 text-emerald-700',
    OSDS: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('ReportCenter')}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
              <Handshake className="h-6 w-6" /> Partnership Report
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Activities conducted in partnership with another agency, grouped by project and division
            </p>
          </div>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Handshake className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Partnership Activities</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">{totalWithPartnership}</p>
              <p className="text-xs text-slate-400">{partnershipRate}% of all activities</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-600">By Division</p>
            </div>
            <div className="space-y-1">
              {Object.entries(byDivision).map(([div, count]) => (
                <div key={div} className="flex items-center justify-between">
                  <Badge className={divisionColors[div] || 'bg-slate-100 text-slate-700'}>{div}</Badge>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
              {Object.keys(byDivision).length === 0 && (
                <p className="text-xs text-slate-400">No data</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <FolderKanban className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-600">By Project (Top 5)</p>
            </div>
            <div className="space-y-1">
              {Object.entries(byProject)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([pid, count]) => {
                  const p = projects.find(pr => pr.id === pid);
                  return (
                    <div key={pid} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-600 truncate">{p ? p.Project_Code : '—'}</span>
                      <span className="text-sm font-semibold flex-shrink-0">{count}</span>
                    </div>
                  );
                })}
              {Object.keys(byProject).length === 0 && (
                <p className="text-xs text-slate-400">No project links found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by activity or partner agency..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={divisionFilter} onValueChange={setDivision}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                {DIVISIONS.map(d => (
                  <SelectItem key={d} value={d}>{d === 'All' ? 'All Divisions' : d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProject}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Projects</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.Project_Code} – {p.Project_Title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1e3a5f]">
            Partnership Activities ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Activity</TableHead>
                  <TableHead className="font-semibold">Division</TableHead>
                  <TableHead className="font-semibold">Partner Agency</TableHead>
                  <TableHead className="font-semibold">Partnership Type(s)</TableHead>
                  <TableHead className="font-semibold">Linked Projects</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date Conducted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                      No partnership activities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(a => {
                    const types = Array.isArray(a.partnership_type) ? a.partnership_type : [];
                    const othersLabel = a.partnership_type_other;
                    return (
                      <TableRow key={a.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium max-w-[240px]">
                          <Link
                            to={createPageUrl(`ActivityView?id=${a.id}`)}
                            className="text-blue-700 hover:underline"
                          >
                            {a.Activity_Title || a.Title || '—'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={divisionColors[a.Functional_Division] || 'bg-slate-100 text-slate-700'}>
                            {a.Functional_Division || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{a.partner_agency_name || '—'}</TableCell>
                        <TableCell className="max-w-[220px]">
                          <div className="flex flex-wrap gap-1">
                            {types.map(t => (
                              <Badge key={t} variant="outline" className="text-xs">
                                {t === 'Others (please specify)' && othersLabel ? `Others: ${othersLabel}` : t}
                              </Badge>
                            ))}
                            {types.length === 0 && <span className="text-slate-400 text-xs">—</span>}
                          </div>
                        </TableCell>
                        <TableCell>{getActivityProjects(a)}</TableCell>
                        <TableCell>
                          <Badge className={
                            a.Status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                            a.Status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            a.Status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }>
                            {a.Status || 'Not Started'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {a.Date_Conducted || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}