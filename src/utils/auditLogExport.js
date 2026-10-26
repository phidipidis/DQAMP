/**
 * Audit Log export utilities.
 * Handles CSV, XLSX, and PDF generation with full pagination,
 * formula-injection escaping, and readable JSON formatting.
 */
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { drawReportHeader, drawFooter } from '@/lib/pdfReportTemplate';
import { base44 } from '@/api/base44Client';

const PHT_TZ = 'Asia/Manila';

const BRAND_BLUE = [30, 58, 95];
const LIGHT_GRAY = [248, 250, 252];
const MID_GRAY = [100, 116, 139];
const DARK_TEXT = [15, 23, 42];

const COL_WEIGHT_MAP = {
  id: 28,
  Timestamp: 30,
  Action_Type: 18,
  Entity: 22,
  Record_ID: 25,
  User_Email: 30,
  Remarks: 30,
  Previous_Values: 35,
  New_Values: 35,
};

const STANDARD_COLUMNS = [
  { key: 'id', label: 'Log ID' },
  { key: 'Timestamp', label: 'Timestamp', type: 'timestamp' },
  { key: 'Action_Type', label: 'Action Type' },
  { key: 'Entity', label: 'Entity' },
  { key: 'Record_ID', label: 'Record ID' },
  { key: 'User_Email', label: 'User Email' },
  { key: 'Remarks', label: 'Remarks', optional: 'includeRemarks' },
  { key: 'Previous_Values', label: 'Previous Values', optional: 'includePrevious', type: 'json' },
  { key: 'New_Values', label: 'New Values', optional: 'includeNew', type: 'json' },
];

/* ── Formatting helpers ── */

export function formatPHT(date, opts = {}) {
  return new Date(date).toLocaleString('en-PH', { timeZone: PHT_TZ, ...opts });
}

export function generateFilename(format) {
  const now = new Date();
  const datePart = now.toLocaleDateString('en-CA', { timeZone: PHT_TZ });
  const timePart = now
    .toLocaleTimeString('en-GB', { timeZone: PHT_TZ, hour12: false })
    .replace(/:/g, '');
  const ext = format === 'xlsx' ? 'xlsx' : format;
  return `DQAMP_Audit_Logs_${datePart}_${timePart}.${ext}`;
}

export function escapeFormula(value) {
  if (value == null) return '';
  const str = String(value);
  if (/^[=+\-@]/.test(str)) return `'${str}`;
  return str;
}

export function parseJsonReadable(str) {
  if (!str) return '';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

export function formatTimestampReadable(timestamp) {
  if (!timestamp) return '';
  return formatPHT(timestamp, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/* ── Column / row builders ── */

export function getExportColumns(options) {
  return STANDARD_COLUMNS.filter((col) => {
    if (!col.optional) return true;
    return options[col.optional];
  });
}

export function buildExportRow(log, columns) {
  return columns.map((col) => {
    let val;
    if (col.key === 'id') val = log.id || '';
    else val = log[col.key];
    if (col.type === 'timestamp') val = formatTimestampReadable(val);
    if (col.type === 'json') val = parseJsonReadable(val);
    return escapeFormula(val ?? '');
  });
}

export function buildMetadataRows(meta) {
  if (!meta.includeFiltersInHeader) return [];
  return [
    ['DQAMP Central – Audit Logs Export'],
    ['Exported by:', meta.admin || '—'],
    ['Export date:', meta.exportDate],
    ['Records:', meta.recordCount],
    ['Applied filters:', meta.filters || 'None'],
    [],
  ];
}

/* ── Data fetching with cursor pagination ── */

export async function fetchAllMatchingLogs(filters = {}, onProgress) {
  const { entityFilter, actionFilter, dateFrom, dateTo } = filters;
  const query = {};
  if (entityFilter && entityFilter !== 'All') query.Entity = entityFilter;
  if (actionFilter && actionFilter !== 'All') query.Action_Type = actionFilter;
  if (dateFrom || dateTo) {
    query.Timestamp = {};
    if (dateFrom) query.Timestamp.$gte = new Date(dateFrom + 'T00:00:00').toISOString();
    if (dateTo) query.Timestamp.$lte = new Date(dateTo + 'T23:59:59').toISOString();
  }

  let allLogs = [];
  let lastTimestamp = null;
  const batchSize = 500;

  while (true) {
    const batchQuery = { ...query };
    if (lastTimestamp) {
      batchQuery.Timestamp = { ...(batchQuery.Timestamp || {}), $lt: lastTimestamp };
    }
    const batch = await base44.entities.Audit_Log.filter(batchQuery, '-Timestamp', batchSize);
    if (!batch || batch.length === 0) break;
    allLogs = allLogs.concat(batch);
    onProgress?.(allLogs.length);
    if (batch.length < batchSize) break;
    lastTimestamp = batch[batch.length - 1].Timestamp;
  }

  return allLogs;
}

export function applyKeywordFilter(logs, keyword) {
  if (!keyword) return logs;
  const q = keyword.toLowerCase();
  return logs.filter(
    (log) =>
      log.User_Email?.toLowerCase().includes(q) ||
      log.Remarks?.toLowerCase().includes(q) ||
      log.Record_ID?.toLowerCase().includes(q)
  );
}

/* ── Download helper ── */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── CSV export ── */

export function exportCSV(rows, columns, meta, filename) {
  const metaRows = buildMetadataRows(meta);
  const escapeCell = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [];
  metaRows.forEach((row) => lines.push(row.map(escapeCell).join(',')));
  lines.push(columns.map((c) => escapeCell(c.label)).join(','));
  rows.forEach((row) => lines.push(row.map(escapeCell).join(',')));
  const csv = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/* ── XLSX export ── */

export function exportXLSX(rows, columns, meta, filename) {
  const metaRows = buildMetadataRows(meta);
  const aoa = [...metaRows, columns.map((c) => c.label), ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths — computed from header + data rows
  const colLengths = columns.map((c) => c.label.length);
  rows.forEach((row) => {
    row.forEach((cell, i) => {
      const len = String(cell ?? '').length;
      if (len > colLengths[i]) colLengths[i] = len;
    });
  });
  ws['!cols'] = colLengths.map((len) => ({ wch: Math.min(Math.max(len + 2, 12), 55) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
}

/* ── PDF export (landscape, header repeat, text wrapping) ── */

export function exportPDF(rows, columns, meta, filename) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const minRowH = 6;
  const lineH = 3.2;
  const padding = 2;

  let y = drawReportHeader(doc, {
    reportTitle: 'DQAMP Central – Audit Logs Export',
    reportSubtitle: meta.exportDate,
  });

  // Meta block
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...MID_GRAY);
  doc.text(`Exported by: ${meta.admin || '—'}`, margin, y);
  doc.text(`Records exported: ${meta.recordCount}`, pageW - margin, y, { align: 'right' });
  y += 5;
  if (meta.filters) {
    const filterLines = doc.splitTextToSize(
      `Applied filters: ${meta.filters}`,
      pageW - margin * 2
    );
    doc.text(filterLines, margin, y);
    y += filterLines.length * 4.5;
  }
  y += 3;
  doc.setTextColor(...DARK_TEXT);

  // Column widths — proportional to weights
  const tableW = pageW - margin * 2;
  const weights = columns.map((c) => COL_WEIGHT_MAP[c.key] || 25);
  const totalW = weights.reduce((a, b) => a + b, 0);
  const colWidths = weights.map((w) => (w / totalW) * tableW);

  const drawTableHeader = (startY) => {
    let x = margin;
    doc.setFillColor(...BRAND_BLUE);
    columns.forEach((_, i) => {
      doc.rect(x, startY, colWidths[i], 7, 'F');
      x += colWidths[i];
    });
    doc.setFontSize(6);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    x = margin;
    columns.forEach((col, i) => {
      doc.text(String(col.label), x + 1.5, startY + 4.5);
      x += colWidths[i];
    });
    doc.setTextColor(...DARK_TEXT);
    doc.setFont(undefined, 'normal');
    return startY + 7;
  };

  y = drawTableHeader(y);
  doc.setFontSize(6);

  rows.forEach((row, idx) => {
    // Pre-compute wrapped lines per cell to determine row height
    const cellTexts = row.map((cell, i) =>
      doc.splitTextToSize(String(cell ?? ''), colWidths[i] - 3)
    );
    const maxLines = Math.max(1, ...cellTexts.map((t) => t.length));
    const rowH = Math.max(minRowH, maxLines * lineH + padding);

    // Page break with header repeat
    if (y + rowH > pageH - 16) {
      doc.addPage();
      y = 20;
      y = drawTableHeader(y);
      doc.setFontSize(6);
    }

    // Alternating background
    if (idx % 2 === 1) {
      doc.setFillColor(...LIGHT_GRAY);
      let x = margin;
      colWidths.forEach((w) => {
        doc.rect(x, y, w, rowH, 'F');
        x += w;
      });
    }

    // Cell text
    let x = margin;
    cellTexts.forEach((lines, i) => {
      doc.setTextColor(...DARK_TEXT);
      lines.forEach((line, li) => {
        doc.text(line, x + 1.5, y + 3 + li * lineH);
      });
      x += colWidths[i];
    });
    y += rowH;
  });

  // Footer on every page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, i, pageCount);
  }

  doc.save(filename);
}