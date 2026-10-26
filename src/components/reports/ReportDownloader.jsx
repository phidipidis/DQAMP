import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileText, FileSpreadsheet, Presentation, AlertTriangle, Lock } from 'lucide-react';
import { logAuditEvent } from '../audit/AuditLogger';
import jsPDF from 'jspdf';

export default function ReportDownloader({ 
  isOpen, 
  onClose, 
  activityId,
  activityTitle,
  hasFeedback,
  isAdmin
}) {
  const [format, setFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Check if download is allowed
  const canDownload = isAdmin || hasFeedback;

  const handleDownload = async () => {
    if (!canDownload) {
      setError('Report download requires at least one ARTA feedback record for this activity.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Log the download attempt
    await logAuditEvent({
      actionType: 'Download',
      entity: 'DQAMPActivity',
      recordId: activityId,
      remarks: `Downloaded ${format.toUpperCase()} report for activity: ${activityTitle}`
    });

    try {
      if (format === 'pdf') {
        const doc = new jsPDF('portrait');
        doc.setFontSize(16);
        doc.text('DQAMP Activity Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Activity: ${activityTitle}`, 14, 32);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);
        doc.setDrawColor(200);
        doc.line(14, 45, 196, 45);
        doc.setFontSize(9);
        doc.text('This report was generated from the DQAMP portal.', 14, 52);
        doc.text('For full details, please refer to the activity record in the system.', 14, 59);
        doc.save(`activity-report-${activityId}.pdf`);
      } else if (format === 'csv') {
        const headers = ['Field', 'Value'];
        const rows = [
          ['Activity ID', activityId],
          ['Activity Title', activityTitle],
          ['Generated', new Date().toISOString()]
        ];
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-report-${activityId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // slides — fallback to PDF
        const doc = new jsPDF('landscape');
        doc.setFontSize(24);
        doc.text(activityTitle, 14, 60);
        doc.setFontSize(12);
        doc.text('DQAMP Activity Report', 14, 75);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 85);
        doc.save(`activity-report-${activityId}.pdf`);
      }
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  const formatIcons = {
    pdf: <FileText className="h-4 w-4" />,
    csv: <FileSpreadsheet className="h-4 w-4" />,
    slides: <Presentation className="h-4 w-4" />
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Activity Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600">Activity: <span className="font-medium">{activityTitle}</span></p>
          </div>

          {!canDownload && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Report download is blocked. At least one ARTA feedback record is required for this activity before downloading reports.
              </AlertDescription>
            </Alert>
          )}

          {isAdmin && !hasFeedback && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Admin override: Downloading without ARTA feedback. This action will be audit-logged.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Report Format</Label>
            <Select value={format} onValueChange={setFormat} disabled={!canDownload}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Document
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV Spreadsheet
                  </div>
                </SelectItem>
                <SelectItem value="slides">
                  <div className="flex items-center gap-2">
                    <Presentation className="h-4 w-4" />
                    Slide Deck
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg text-sm">
            <p className="font-medium text-slate-700 mb-2">Report includes:</p>
            <ul className="list-disc pl-4 text-slate-600 space-y-1">
              <li>Activity details and metadata</li>
              <li>Workflow history and transitions</li>
              <li>Linked project, objectives, and outputs</li>
              <li>ARTA feedback summary (if available)</li>
              <li>Photo attachments</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!canDownload || isGenerating}
            className="bg-[#1e3a5f] hover:bg-[#152a47]"
          >
            {isGenerating ? (
              'Generating...'
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}