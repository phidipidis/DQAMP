/**
 * Shared PDF report template for all DQAMP report exports.
 * Provides consistent header, table drawing, and footer utilities.
 */
import jsPDF from 'jspdf';

const BRAND_BLUE = [30, 58, 95];   // #1e3a5f
const BRAND_TEAL = [13, 148, 136]; // #1E3A5F
const LIGHT_GRAY = [248, 250, 252];
const MID_GRAY   = [100, 116, 139];
const DARK_TEXT  = [15, 23, 42];

/**
 * Draw a standardized report header.
 * @param {jsPDF} doc
 * @param {object} opts
 *   reportTitle      – main title string
 *   reportSubtitle   – optional subtitle / MC reference
 *   projectName      – optional project or scope label
 *   reportingPeriod  – e.g. "Q1–Q2 2026"
 * @returns {number} y – position after the header block
 */
export function drawReportHeader(doc, { reportTitle, reportSubtitle, projectName, reportingPeriod }) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Blue banner
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageW, 28, 'F');

  // Teal accent stripe
  doc.setFillColor(...BRAND_TEAL);
  doc.rect(0, 28, pageW, 3, 'F');

  // Logo text / agency
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.text('Department of Education – Schools Division Office', margin, 8);

  // Report title
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text(reportTitle, margin, 17);

  // Subtitle (right-aligned)
  if (reportSubtitle) {
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text(reportSubtitle, pageW - margin, 17, { align: 'right' });
  }

  doc.setTextColor(...DARK_TEXT);

  let y = 38;

  // Meta row
  const metaParts = [];
  if (projectName)      metaParts.push(`Project / Scope: ${projectName}`);
  if (reportingPeriod)  metaParts.push(`Reporting Period: ${reportingPeriod}`);
  metaParts.push(`Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`);

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...MID_GRAY);
  doc.text(metaParts.join('   |   '), margin, y);
  doc.setTextColor(...DARK_TEXT);

  y += 6;
  // Thin divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  return y;
}

/**
 * Draw a summary stats row (up to 4 items).
 * @param {jsPDF} doc
 * @param {Array<{label:string, value:string}>} stats
 * @param {number} startY
 * @returns {number} y after the stats block
 */
export function drawSummaryStats(doc, stats, startY) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const boxH = 16;
  const gap = 4;
  const count = Math.min(stats.length, 4);
  const boxW = (pageW - margin * 2 - gap * (count - 1)) / count;

  stats.slice(0, count).forEach((stat, i) => {
    const x = margin + i * (boxW + gap);
    doc.setFillColor(...LIGHT_GRAY);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(x, startY, boxW, boxH, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...MID_GRAY);
    doc.text(stat.label, x + 3, startY + 5);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...BRAND_BLUE);
    doc.text(String(stat.value), x + 3, startY + 13);
  });

  doc.setTextColor(...DARK_TEXT);
  return startY + boxH + 6;
}

/**
 * Draw a section heading.
 */
export function drawSectionHeading(doc, text, y) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(margin, y, pageW - margin * 2, 6, 'F');
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(text, margin + 2, y + 4.5);
  doc.setTextColor(...DARK_TEXT);
  return y + 10;
}

/**
 * Draw a data table with alternating row shading.
 * @param {jsPDF} doc
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @param {number} startY
 * @param {number[]} colWidths
 * @param {object} [opts]
 *   alignRight – array of column indices to right-align
 * @returns {number} y after table
 */
export function drawTable(doc, headers, rows, startY, colWidths, opts = {}) {
  const margin = 14;
  const rowH = 8;
  const { alignRight = [] } = opts;
  let y = startY;

  // Header row
  doc.setFillColor(...BRAND_BLUE);
  let x = margin;
  colWidths.forEach(w => {
    doc.rect(x, y, w, rowH, 'F');
    x += w;
  });
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(255, 255, 255);
  x = margin;
  headers.forEach((h, i) => {
    const align = alignRight.includes(i) ? 'right' : 'left';
    const tx = align === 'right' ? x + colWidths[i] - 2 : x + 2;
    doc.text(String(h), tx, y + 5.5, { align });
    x += colWidths[i];
  });
  y += rowH;

  doc.setFont(undefined, 'normal');
  doc.setTextColor(...DARK_TEXT);

  rows.forEach((row, rowIdx) => {
    if (y + rowH > doc.internal.pageSize.getHeight() - 18) {
      doc.addPage();
      y = 20;
    }
    // Alternating background
    if (rowIdx % 2 === 1) {
      doc.setFillColor(...LIGHT_GRAY);
      let x2 = margin;
      colWidths.forEach(w => { doc.rect(x2, y, w, rowH, 'F'); x2 += w; });
    }
    // Cell borders
    doc.setDrawColor(220, 220, 220);
    let x2 = margin;
    colWidths.forEach(w => { doc.rect(x2, y, w, rowH); x2 += w; });

    // Cell text
    doc.setFontSize(7);
    x2 = margin;
    row.forEach((cell, i) => {
      const text = doc.splitTextToSize(String(cell ?? ''), colWidths[i] - 3);
      const align = alignRight.includes(i) ? 'right' : 'left';
      const tx = align === 'right' ? x2 + colWidths[i] - 2 : x2 + 2;
      doc.text(text, tx, y + 5, { align });
      x2 += colWidths[i];
    });
    y += rowH;
  });

  return y + 4;
}

/**
 * Draw a footer on the current page.
 */
export function drawFooter(doc, pageNum, totalPages) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...BRAND_TEAL);
  doc.line(14, pageH - 12, pageW - 14, pageH - 12);
  doc.setFontSize(6);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...MID_GRAY);
  doc.text('DQAMP Monitoring and Evaluation System', 14, pageH - 7);
  doc.text(`Page ${pageNum}${totalPages ? ' of ' + totalPages : ''}`, pageW - 14, pageH - 7, { align: 'right' });
  doc.setTextColor(...DARK_TEXT);
}

/**
 * Create a new landscape or portrait jsPDF with standard margins.
 */
export function createDoc(orientation = 'landscape') {
  return new jsPDF(orientation);
}