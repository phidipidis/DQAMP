import * as XLSX from 'xlsx';
import { logAuditEvent } from '@/components/audit/AuditLogger';

// Formula-injection protection for spreadsheet cells
const sanitize = (val) => {
  if (val == null) return '';
  const s = String(val);
  if (/^[=+\-@]/.test(s)) return `'${s}`;
  return s;
};

const timestamp = () => new Date().toISOString().slice(0, 10);

export async function exportProjectsNaming(projects) {
  const rows = projects.map(p => ({
    'Project Code': sanitize(p.Project_Code),
    'Project Title': sanitize(p.Project_Title),
    'Division': sanitize(p.Functional_Division),
    'Status': sanitize(p.Project_Status),
    'Start Date': sanitize(p.Project_Start_Date),
    'End Date': sanitize(p.Project_End_Date),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 18 }, { wch: 50 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Projects');
  XLSX.writeFile(wb, `DQAMP_Project_Naming_Standards_${timestamp()}.xlsx`);
  await logAuditEvent({ actionType: 'Export', entity: 'Project', remarks: `Exported ${rows.length} project names & codes` });
}

export async function exportActivitiesNaming(activities) {
  const rows = activities.map(a => ({
    'Activity ID': sanitize(a.Activity_ID),
    'Activity Title': sanitize(a.Activity_Title || a.Title),
    'Division': sanitize(a.Functional_Division),
    'Activity Type': sanitize(a.Activity_Type),
    'Status': sanitize(a.Status),
    'Workflow Status': sanitize(a.Workflow_Status),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 50 }, { wch: 10 }, { wch: 24 }, { wch: 14 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Activities');
  XLSX.writeFile(wb, `DQAMP_Activity_Naming_Standards_${timestamp()}.xlsx`);
  await logAuditEvent({ actionType: 'Export', entity: 'DQAMPActivity', remarks: `Exported ${rows.length} activity names & codes` });
}