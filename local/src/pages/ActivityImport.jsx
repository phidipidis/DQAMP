import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { logAuditEvent } from '../components/audit/AuditLogger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const REQUIRED_COLUMNS = ['Title', 'Functional_Division'];
const VALID_DIVISIONS = ['CID', 'SGOD', 'OSDS'];
const VALID_CATEGORIES = ['Training', 'Program LRM', 'PIR', 'Research', 'Conference'];
const VALID_FUNDING = ['MOOE', 'SARO', 'SEF', 'Others'];

export default function ActivityImport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importStatus, setImportStatus] = useState('idle'); // idle, validating, valid, invalid, importing, complete

  const importMutation = useMutation({
    mutationFn: async (records) => {
      const results = [];
      for (const record of records) {
        const result = await base44.entities.DQAMPActivity.create({
          ...record,
          Workflow_Status: 'Draft',
          Financial_Allocation: record.Financial_Allocation ? parseFloat(record.Financial_Allocation) : null
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: async (results) => {
      await logAuditEvent({
        actionType: 'Import',
        entity: 'DQAMPActivity',
        recordId: null,
        remarks: `Bulk imported ${results.length} activities from CSV`
      });
      queryClient.invalidateQueries(['activities']);
      setImportStatus('complete');
    }
  });

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      records.push(record);
    }

    return records;
  };

  const validateRecords = (records) => {
    const errors = [];

    // Check headers
    const headers = Object.keys(records[0] || {});
    for (const required of REQUIRED_COLUMNS) {
      if (!headers.includes(required)) {
        errors.push({ row: 0, message: `Missing required column: ${required}` });
      }
    }

    // Validate each record
    records.forEach((record, idx) => {
      const rowNum = idx + 2; // Account for header row and 0-index

      if (!record.Title?.trim()) {
        errors.push({ row: rowNum, message: 'Title is required' });
      }

      if (!record.Functional_Division?.trim()) {
        errors.push({ row: rowNum, message: 'Functional_Division is required' });
      } else if (!VALID_DIVISIONS.includes(record.Functional_Division)) {
        errors.push({ row: rowNum, message: `Invalid Functional_Division: ${record.Functional_Division}. Must be one of: ${VALID_DIVISIONS.join(', ')}` });
      }

      if (record.Category && !VALID_CATEGORIES.includes(record.Category)) {
        errors.push({ row: rowNum, message: `Invalid Category: ${record.Category}. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }

      if (record.Funding_Source && !VALID_FUNDING.includes(record.Funding_Source)) {
        errors.push({ row: rowNum, message: `Invalid Funding_Source: ${record.Funding_Source}. Must be one of: ${VALID_FUNDING.join(', ')}` });
      }

      if (record.Financial_Allocation && isNaN(parseFloat(record.Financial_Allocation))) {
        errors.push({ row: rowNum, message: 'Financial_Allocation must be a number' });
      }
    });

    return errors;
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportStatus('validating');
    setValidationErrors([]);
    setParsedData([]);

    const text = await selectedFile.text();
    const records = parseCSV(text);
    setParsedData(records);

    const errors = validateRecords(records);
    setValidationErrors(errors);
    setImportStatus(errors.length === 0 ? 'valid' : 'invalid');
  };

  const handleImport = () => {
    if (importStatus !== 'valid' || parsedData.length === 0) return;
    setImportStatus('importing');
    importMutation.mutate(parsedData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('Activities'))}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">CSV Import</h1>
          <p className="text-slate-600">Bulk import activities from CSV file</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Required columns:</strong> Title, Functional_Division<br />
          <strong>Optional columns:</strong> Description, Category, Funding_Source, Schedule_Start_Date, 
          Schedule_End_Date, Planned_Completion_Date, Planned_Disbursement_Date, Financial_Allocation, Evidence_Notes<br />
          <strong>Valid Divisions:</strong> CID, SGOD, OSDS<br />
          <strong>Valid Categories:</strong> Training, Program LRM, PIR, Research, Conference<br />
          <strong>Valid Funding Sources:</strong> MOOE, SARO, SEF, Others
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f] flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CSV File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importStatus === 'importing'}
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileText className="h-4 w-4" />
                {file.name} ({parsedData.length} records)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationErrors.length > 0 && (
        <Card className="shadow-md border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Validation Errors ({validationErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationErrors.map((error, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{error.row}</TableCell>
                      <TableCell className="text-red-600">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {parsedData.length > 0 && importStatus !== 'complete' && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1e3a5f]">Preview (First 10 Records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Title</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Funding</TableHead>
                    <TableHead>Allocation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 10).map((record, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{record.Title}</TableCell>
                      <TableCell>{record.Functional_Division}</TableCell>
                      <TableCell>{record.Category || '-'}</TableCell>
                      <TableCell>{record.Funding_Source || '-'}</TableCell>
                      <TableCell>{record.Financial_Allocation ? `₱${parseFloat(record.Financial_Allocation).toLocaleString()}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedData.length > 10 && (
              <p className="mt-2 text-sm text-slate-500">... and {parsedData.length - 10} more records</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {importStatus === 'valid' && (
        <div className="flex justify-end">
          <Button 
            onClick={handleImport} 
            className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
            disabled={importMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Import {parsedData.length} Activities
          </Button>
        </div>
      )}

      {/* Success */}
      {importStatus === 'complete' && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            Successfully imported {parsedData.length} activities. All records have been created with Draft status.
            <Button 
              variant="link" 
              className="p-0 ml-2 text-emerald-700"
              onClick={() => navigate(createPageUrl('Activities'))}
            >
              View Activities →
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}