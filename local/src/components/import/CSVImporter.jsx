import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { logAuditEvent } from '../audit/AuditLogger';

export default function CSVImporter({ 
  isOpen, 
  onClose, 
  entityName, 
  requiredFields,
  optionalFields,
  onImport 
}) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return { headers: [], data: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = { _rowIndex: index + 2 };
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    return { headers, data };
  };

  const validateData = (data) => {
    const validationErrors = [];
    
    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field.name] || row[field.name].trim() === '') {
          validationErrors.push({
            row: row._rowIndex,
            field: field.name,
            message: `${field.label} is required`
          });
        }
      });

      // Validate enum fields
      [...requiredFields, ...optionalFields].forEach(field => {
        if (field.enum && row[field.name] && !field.enum.includes(row[field.name])) {
          validationErrors.push({
            row: row._rowIndex,
            field: field.name,
            message: `Invalid value "${row[field.name]}" for ${field.label}. Valid values: ${field.enum.join(', ')}`
          });
        }
      });
    });

    return validationErrors;
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setErrors([{ message: 'Please upload a CSV file' }]);
      return;
    }

    setFile(selectedFile);
    setIsValidating(true);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const { headers, data } = parseCSV(event.target.result);
      
      // Check if required headers exist
      const missingHeaders = requiredFields
        .filter(f => !headers.includes(f.name))
        .map(f => f.name);

      if (missingHeaders.length > 0) {
        setErrors([{ 
          message: `Missing required columns: ${missingHeaders.join(', ')}` 
        }]);
        setIsValidating(false);
        return;
      }

      const validationErrors = validateData(data);
      setErrors(validationErrors);
      setParsedData(data);
      setIsValidating(false);
    };

    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (errors.length > 0 || parsedData.length === 0) return;

    setIsImporting(true);
    
    const cleanedData = parsedData.map(row => {
      const cleaned = {};
      [...requiredFields, ...optionalFields].forEach(field => {
        if (row[field.name] !== undefined && row[field.name] !== '') {
          if (field.type === 'number') {
            cleaned[field.name] = parseFloat(row[field.name]) || 0;
          } else {
            cleaned[field.name] = row[field.name];
          }
        }
      });
      return cleaned;
    });

    await onImport(cleanedData);

    await logAuditEvent({
      actionType: 'Import',
      entity: entityName,
      remarks: `Bulk imported ${cleanedData.length} records from CSV`
    });

    setIsImporting(false);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {entityName} from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label>Upload CSV File</Label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          {/* Required Fields Info */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Required Columns:</p>
            <div className="flex flex-wrap gap-2">
              {requiredFields.map(field => (
                <span key={field.name} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                  {field.name}
                </span>
              ))}
            </div>
            <p className="text-sm font-medium text-slate-700 mt-3 mb-2">Optional Columns:</p>
            <div className="flex flex-wrap gap-2">
              {optionalFields.map(field => (
                <span key={field.name} className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded">
                  {field.name}
                </span>
              ))}
            </div>
          </div>

          {/* Validation Status */}
          {isValidating && (
            <div className="text-center py-4 text-slate-500">
              Validating CSV data...
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Validation errors found ({errors.length}):</p>
                <ul className="list-disc pl-4 max-h-32 overflow-y-auto text-sm">
                  {errors.slice(0, 10).map((error, index) => (
                    <li key={index}>
                      {error.row ? `Row ${error.row}: ` : ''}{error.message}
                    </li>
                  ))}
                  {errors.length > 10 && (
                    <li>...and {errors.length - 10} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedData.length > 0 && errors.length === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">
                  {parsedData.length} records ready to import
                </span>
              </div>
              <div className="max-h-60 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      {requiredFields.slice(0, 4).map(field => (
                        <TableHead key={field.name}>{field.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row._rowIndex}</TableCell>
                        {requiredFields.slice(0, 4).map(field => (
                          <TableCell key={field.name} className="max-w-[150px] truncate">
                            {row[field.name]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-xs text-slate-500 mt-2">
                  Showing first 5 of {parsedData.length} records
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={errors.length > 0 || parsedData.length === 0 || isImporting}
            className="bg-[#1B2A8F] hover:bg-[#152a47]"
          >
            {isImporting ? 'Importing...' : `Import ${parsedData.length} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}