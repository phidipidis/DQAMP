import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Eye,
  ScrollText,
  Download,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import AuditLogExportDialog from '@/components/audit/AuditLogExportDialog';

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingLog, setViewingLog] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const isAdmin = currentUser?.role === 'admin';

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: () => base44.entities.Audit_Log.list('-Timestamp', 500),
    enabled: !!currentUser && isAdmin,
  });

  const entities = [
    'DQAMPActivity',
    'Project',
    'Project_Objectives',
    'ProjectOutputs',
    'DivisionObjective',
    'OrganizationalGoal',
    'QAME_Assessor',
    'ARTAFeedback',
    'User',
  ];
  const actions = [
    'Create',
    'Update',
    'Delete',
    'Submit',
    'Review',
    'Publish',
    'Import',
    'Upload',
    'Download',
    'Revert',
    'Link_Change',
    'Role_Change',
    'Login',
    'Assignment',
    'Export',
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.User_Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.Remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.Record_ID?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEntity = entityFilter === 'All' || log.Entity === entityFilter;
      const matchesAction = actionFilter === 'All' || log.Action_Type === actionFilter;
      const logDate = log.Timestamp ? new Date(log.Timestamp) : null;
      const matchesDateFrom =
        !dateFrom || (logDate && logDate >= new Date(dateFrom + 'T00:00:00'));
      const matchesDateTo =
        !dateTo || (logDate && logDate <= new Date(dateTo + 'T23:59:59'));
      return matchesSearch && matchesEntity && matchesAction && matchesDateFrom && matchesDateTo;
    });
  }, [logs, searchTerm, entityFilter, actionFilter, dateFrom, dateTo]);

  const actionColors = {
    Create: 'bg-emerald-100 text-emerald-800',
    Update: 'bg-blue-100 text-blue-800',
    Delete: 'bg-red-100 text-red-800',
    Submit: 'bg-amber-100 text-amber-800',
    Review: 'bg-purple-100 text-purple-800',
    Publish: 'bg-teal-100 text-teal-800',
    Import: 'bg-indigo-100 text-indigo-800',
    Upload: 'bg-cyan-100 text-cyan-800',
    Download: 'bg-pink-100 text-pink-800',
    Revert: 'bg-orange-100 text-orange-800',
    Link_Change: 'bg-violet-100 text-violet-800',
    Role_Change: 'bg-rose-100 text-rose-800',
    Login: 'bg-gray-100 text-gray-800',
    Assignment: 'bg-lime-100 text-lime-800',
    Export: 'bg-sky-100 text-sky-800',
  };

  const openViewDialog = (log) => {
    setViewingLog(log);
    setViewDialogOpen(true);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString();
  };

  const parseJson = (str) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setEntityFilter('All');
    setActionFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters =
    searchTerm || entityFilter !== 'All' || actionFilter !== 'All' || dateFrom || dateTo;

  // Selection handlers
  const toggleSelectAll = () => {
    if (filteredLogs.length > 0 && filteredLogs.every((l) => selectedIds.has(l.id))) {
      const filteredIdSet = new Set(filteredLogs.map((l) => l.id));
      setSelectedIds(new Set([...selectedIds].filter((id) => !filteredIdSet.has(id))));
    } else {
      setSelectedIds(new Set([...selectedIds, ...filteredLogs.map((l) => l.id)]));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const allFilteredSelected =
    filteredLogs.length > 0 && filteredLogs.every((l) => selectedIds.has(l.id));

  // Loading state
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Admin access guard
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Audit Logs</h1>
          <p className="text-slate-600">Complete audit trail of all system actions</p>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">Access Restricted</p>
                <p className="text-sm text-slate-500 mt-1">
                  Only administrators can view and export audit logs. Contact your
                  system administrator if you need access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Audit Logs</h1>
          <p className="text-slate-600">Complete audit trail of all system actions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ScrollText className="h-4 w-4" />
            {filteredLogs.length} matching records
          </div>
          <Button
            onClick={() => setExportDialogOpen(true)}
            className="bg-[#1e3a5f] hover:bg-[#152d4a]"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Audit Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Total Logs</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">{logs.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Creates</p>
            <p className="text-2xl font-bold text-emerald-600">
              {logs.filter((l) => l.Action_Type === 'Create').length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Updates</p>
            <p className="text-2xl font-bold text-blue-600">
              {logs.filter((l) => l.Action_Type === 'Update').length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Workflow Actions</p>
            <p className="text-2xl font-bold text-amber-600">
              {logs.filter((l) => ['Submit', 'Review', 'Publish'].includes(l.Action_Type)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by user, remarks, or record ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Entities</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[150px]"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size} record{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Logs Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Timestamp</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">Entity</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Remarks</TableHead>
                  <TableHead className="font-semibold text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(log.id)}
                          onCheckedChange={() => toggleSelectRow(log.id)}
                          aria-label={`Select log ${log.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-sm">{formatTimestamp(log.Timestamp)}</TableCell>
                      <TableCell>
                        <Badge
                          className={actionColors[log.Action_Type] || 'bg-gray-100 text-gray-800'}
                        >
                          {log.Action_Type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.Entity}</TableCell>
                      <TableCell className="text-sm">{log.User_Email}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">
                        {log.Remarks || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openViewDialog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Timestamp</p>
                  <p className="font-medium">{formatTimestamp(viewingLog.Timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Action Type</p>
                  <Badge className={actionColors[viewingLog.Action_Type]}>
                    {viewingLog.Action_Type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Entity</p>
                  <p className="font-medium">{viewingLog.Entity}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Record ID</p>
                  <p className="font-medium font-mono text-xs">{viewingLog.Record_ID || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">User</p>
                  <p className="font-medium">{viewingLog.User_Email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Remarks</p>
                  <p>{viewingLog.Remarks || '-'}</p>
                </div>
              </div>

              {viewingLog.Previous_Values && (
                <div className="border-t pt-4">
                  <p className="text-sm text-slate-500 mb-2">Previous Values</p>
                  <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(parseJson(viewingLog.Previous_Values), null, 2)}
                  </pre>
                </div>
              )}

              {viewingLog.New_Values && (
                <div className="border-t pt-4">
                  <p className="text-sm text-slate-500 mb-2">New Values</p>
                  <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(parseJson(viewingLog.New_Values), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <AuditLogExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        logs={logs}
        filteredLogs={filteredLogs}
        selectedIds={selectedIds}
        currentFilters={{ searchTerm, entityFilter, actionFilter, dateFrom, dateTo }}
        adminEmail={currentUser?.email}
        onExportComplete={() =>
          queryClient.invalidateQueries({ queryKey: ['audit_logs'] })
        }
      />
    </div>
  );
}