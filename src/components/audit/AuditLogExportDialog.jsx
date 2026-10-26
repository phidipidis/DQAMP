import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import {
  generateFilename,
  getExportColumns,
  buildExportRow,
  fetchAllMatchingLogs,
  applyKeywordFilter,
  exportCSV,
  exportXLSX,
  exportPDF,
  formatPHT,
} from '@/utils/auditLogExport';
import { logAuditEvent } from '@/components/audit/AuditLogger';

const SCOPES = [
  { value: 'all', label: 'All audit logs' },
  { value: 'filtered', label: 'Current filtered results' },
  { value: 'selected', label: 'Selected audit-log entries' },
  { value: 'daterange', label: 'Logs within a specified date range' },
];

const FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'pdf', label: 'PDF' },
];

export default function AuditLogExportDialog({
  open,
  onOpenChange,
  logs,
  filteredLogs,
  selectedIds,
  currentFilters,
  adminEmail,
  onExportComplete,
}) {
  const [exportScope, setExportScope] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includePrevious, setIncludePrevious] = useState(true);
  const [includeNew, setIncludeNew] = useState(true);
  const [includeRemarks, setIncludeRemarks] = useState(true);
  const [includeFiltersInHeader, setIncludeFiltersInHeader] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const options = { includePrevious, includeNew, includeRemarks };
  const columns = getExportColumns(options);
  const hasValueColumns = includePrevious || includeNew;
  const selectedCount = selectedIds?.size || 0;
  const filteredCount = filteredLogs?.length || 0;

  const resetState = () => {
    setExportScope('all');
    setExportFormat('csv');
    setDateFrom('');
    setDateTo('');
    setIncludePrevious(true);
    setIncludeNew(true);
    setIncludeRemarks(true);
    setIncludeFiltersInHeader(true);
    setProgress(0);
  };

  const buildFiltersSummary = (scope) => {
    const parts = [];
    if (scope === 'filtered') {
      if (currentFilters.entityFilter !== 'All')
        parts.push(`Entity: ${currentFilters.entityFilter}`);
      if (currentFilters.actionFilter !== 'All')
        parts.push(`Action: ${currentFilters.actionFilter}`);
      if (currentFilters.searchTerm)
        parts.push(`Keyword: "${currentFilters.searchTerm}"`);
      if (currentFilters.dateFrom) parts.push(`From: ${currentFilters.dateFrom}`);
      if (currentFilters.dateTo) parts.push(`To: ${currentFilters.dateTo}`);
      if (!parts.length) parts.push('None');
    } else if (scope === 'daterange') {
      parts.push(
        `Date range: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`
      );
    } else if (scope === 'all') {
      parts.push('None');
    } else if (scope === 'selected') {
      parts.push(`Selected records only (${selectedCount})`);
    }
    return parts.join('; ');
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    try {
      let logsToExport = [];

      if (exportScope === 'selected') {
        logsToExport = (filteredLogs || logs || []).filter((l) =>
          selectedIds?.has(l.id)
        );
        setProgress(logsToExport.length);
      } else if (exportScope === 'all') {
        logsToExport = await fetchAllMatchingLogs({}, (count) =>
          setProgress(count)
        );
      } else if (exportScope === 'filtered') {
        const allMatching = await fetchAllMatchingLogs(
          {
            entityFilter: currentFilters.entityFilter,
            actionFilter: currentFilters.actionFilter,
            dateFrom: currentFilters.dateFrom,
            dateTo: currentFilters.dateTo,
          },
          (count) => setProgress(count)
        );
        logsToExport = applyKeywordFilter(allMatching, currentFilters.searchTerm);
      } else if (exportScope === 'daterange') {
        if (!dateFrom || !dateTo) {
          toast.error('Please specify both start and end dates.');
          setIsExporting(false);
          return;
        }
        logsToExport = await fetchAllMatchingLogs(
          { dateFrom, dateTo },
          (count) => setProgress(count)
        );
      }

      // Sort by timestamp descending
      logsToExport.sort(
        (a, b) =>
          new Date(b.Timestamp || 0).getTime() -
          new Date(a.Timestamp || 0).getTime()
      );

      const rows = logsToExport.map((log) => buildExportRow(log, columns));
      const filename = generateFilename(exportFormat);
      const filtersSummary = buildFiltersSummary(exportScope);
      const meta = {
        exportDate: formatPHT(new Date(), {
          dateStyle: 'long',
          timeStyle: 'short',
        }),
        admin: adminEmail,
        recordCount: rows.length,
        filters: includeFiltersInHeader ? filtersSummary : '',
        includeFiltersInHeader,
      };

      if (exportFormat === 'csv') {
        exportCSV(rows, columns, meta, filename);
      } else if (exportFormat === 'xlsx') {
        exportXLSX(rows, columns, meta, filename);
      } else if (exportFormat === 'pdf') {
        exportPDF(rows, columns, meta, filename);
      }

      // Log the export event
      const scopeLabel = {
        all: 'all',
        filtered: 'filtered',
        selected: 'selected',
        daterange: 'date-range',
      }[exportScope];
      const remarks =
        `Exported ${rows.length} ${scopeLabel} audit-log records in ${exportFormat.toUpperCase()} format. ` +
        `${filtersSummary}. ` +
        `Previous values included: ${includePrevious}; New values included: ${includeNew}.`;

      await logAuditEvent({
        actionType: 'Export',
        entity: 'Audit_Log',
        recordId: `EXPORT_${Date.now()}`,
        remarks,
      });

      toast.success(
        `Export successful — ${rows.length} records exported as ${exportFormat.toUpperCase()}.`
      );
      onExportComplete?.();
      onOpenChange(false);
      resetState();
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(
        err?.message || 'An error occurred during export. Please try again.'
      );
    } finally {
      setIsExporting(false);
      setConfirmOpen(false);
    }
  };

  const handleExportClick = () => {
    if (hasValueColumns) {
      setConfirmOpen(true);
    } else {
      handleExport();
    }
  };

  const handleOpenChange = (open) => {
    if (isExporting) return;
    onOpenChange(open);
    if (!open) resetState();
  };

  const progressVisible = isExporting && exportScope !== 'selected';

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-[#1e3a5f]" />
              Export Audit Logs
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Records to export */}
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                Records to export
              </Label>
              <div className="space-y-2">
                {SCOPES.map((s) => (
                  <label
                    key={s.value}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <input
                      type="radio"
                      name="exportScope"
                      value={s.value}
                      checked={exportScope === s.value}
                      onChange={(e) => setExportScope(e.target.value)}
                      disabled={isExporting}
                      className="accent-[#1e3a5f]"
                    />
                    <span>{s.label}</span>
                    {s.value === 'selected' && selectedCount > 0 && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        {selectedCount}
                      </Badge>
                    )}
                    {s.value === 'filtered' && (
                      <span className="text-xs text-slate-400">
                        ({filteredCount} matching)
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Date range (shown for daterange scope) */}
            {exportScope === 'daterange' && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">
                    Start date
                  </Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    disabled={isExporting}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">
                    End date
                  </Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    disabled={isExporting}
                  />
                </div>
              </div>
            )}

            {/* Export format */}
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                Export format
              </Label>
              <div className="flex gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setExportFormat(f.value)}
                    disabled={isExporting}
                    className={`flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                      exportFormat === f.value
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional options */}
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                Additional options
              </Label>
              <div className="space-y-2 pl-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={includePrevious}
                    onCheckedChange={setIncludePrevious}
                    disabled={isExporting}
                  />
                  <span>Include previous values</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={includeNew}
                    onCheckedChange={setIncludeNew}
                    disabled={isExporting}
                  />
                  <span>Include new values</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={includeRemarks}
                    onCheckedChange={setIncludeRemarks}
                    disabled={isExporting}
                  />
                  <span>Include remarks</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={includeFiltersInHeader}
                    onCheckedChange={setIncludeFiltersInHeader}
                    disabled={isExporting}
                  />
                  <span>Include applied filters in export header</span>
                </label>
              </div>
            </div>

            {/* Progress indicator */}
            {progressVisible && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-md p-3">
                <Loader2 className="h-4 w-4 animate-spin text-[#1e3a5f]" />
                <span>Retrieving records... {progress} fetched</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportClick}
              disabled={isExporting || (exportScope === 'selected' && selectedCount === 0)}
              className="bg-[#1e3a5f] hover:bg-[#152d4a]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation for value columns */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export includes value data</AlertDialogTitle>
            <AlertDialogDescription>
              This export includes previous and/or new values which may contain
              sensitive record data. Please verify you are authorized to export
              this information before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleExport();
              }}
              disabled={isExporting}
              className="bg-[#1e3a5f] hover:bg-[#152d4a]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                'Confirm & Export'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}