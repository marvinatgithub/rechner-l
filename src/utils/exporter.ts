import { jsPDF } from 'jspdf';
import { CalculationHistoryItem, NumberLocale } from '../types/calculator';
import { formatNumber, splitTimestamp, formatTimestamp } from './formatter';

/**
 * Sanitizes math expressions for exports across different systems, PDF fonts, and Excel.
 * Replaces Unicode mathematical minus (U+2212) and typographic dashes with standard ASCII hyphen (-)
 * to prevent character corruption (e.g. U+2212 rendering as double quote '"' in standard PDF Helvetica).
 * Also cleans irregular spaces.
 */
export function sanitizeExpressionForExport(rawExpr: string): string {
  if (!rawExpr) return '';
  return rawExpr
    .replace(/[\u2212\u2013\u2014]/g, '-') // Replace U+2212 (math minus), en-dash, em-dash with ASCII '-'
    .replace(/[\u00A0\u202F]/g, ' ')       // Replace non-breaking spaces with standard spaces
    .replace(/\s+/g, ' ')                   // Normalize multiple spaces
    .trim();
}

/**
 * Generates a unique filename with date AND time down to the second
 * (e.g. RechnerL_Verlauf_2026-10-24_14-05-32.csv)
 * so multiple exports within the same minute never overwrite existing files.
 */
export function generateExportFilename(extension: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());

  return `RechnerL_Verlauf_${yyyy}-${MM}-${dd}_${hh}-${mm}-${ss}.${extension}`;
}

/**
 * Triggers a browser file download of a string blob.
 */
function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Generates German Excel-compatible CSV.
 * Uses semicolon ';' delimiter, UTF-8 BOM, and standardized ASCII minus for clean Excel display.
 */
export function exportToCSV(items: CalculationHistoryItem[], locale: NumberLocale = 'de-DE'): void {
  // UTF-8 BOM for Microsoft Excel compatibility
  const BOM = '\uFEFF';
  const delimiter = locale === 'de-DE' ? ';' : ',';

  const headers = ['Datum', 'Uhrzeit', 'Ausdruck', 'Ergebnis', 'Notiz'];
  const rows = items.map((item) => {
    const { dateStr, timeStr } = splitTimestamp(item.timestamp, locale);
    const cleanExpr = sanitizeExpressionForExport(item.expression);
    const expr = `"${cleanExpr.replace(/"/g, '""')}"`;
    const res = `"${formatNumber(item.result, locale)}"`;
    const note = `"${(item.note || '').replace(/"/g, '""')}"`;
    return [dateStr, timeStr, expr, res, note].join(delimiter);
  });

  const csvContent = BOM + [headers.join(delimiter), ...rows].join('\r\n');
  const filename = generateExportFilename('csv');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Generates human-readable TXT calculation log.
 */
export function exportToTXT(items: CalculationHistoryItem[], locale: NumberLocale = 'de-DE'): void {
  const nowStr = formatTimestamp(Date.now(), locale);
  const sep = '='.repeat(54);
  const subSep = '-'.repeat(54);

  let text = `${sep}\n`;
  text += `           RECHNER L – BERECHNUNGSPROTOKOLL\n`;
  text += ` Erstellt am: ${nowStr}\n`;
  text += ` Gespeicherte Berechnungen: ${items.length}\n`;
  text += `${sep}\n\n`;

  if (items.length === 0) {
    text += `(Keine Berechnungen im Verlauf vorhanden)\n`;
  } else {
    items.forEach((item, index) => {
      const timeStr = formatTimestamp(item.timestamp, locale);
      const resStr = formatNumber(item.result, locale);
      const cleanExpr = sanitizeExpressionForExport(item.expression);

      text += `[#${items.length - index}] ${timeStr}\n`;
      text += `  Rechnung : ${cleanExpr}\n`;
      text += `  Ergebnis : ${resStr}\n`;
      if (item.note) {
        text += `  Notiz    : ${item.note}\n`;
      }
      text += `${subSep}\n`;
    });
  }

  text += `\nExportiert mit Rechner L (Google Calculator für Android)\n`;
  const filename = generateExportFilename('txt');
  downloadBlob(text, filename, 'text/plain;charset=utf-8;');
}

/**
 * Generates JSON export for backups and data interchange.
 */
export function exportToJSON(items: CalculationHistoryItem[], locale: NumberLocale = 'de-DE'): void {
  const sanitizedItems = items.map((item) => ({
    ...item,
    expression: sanitizeExpressionForExport(item.expression),
  }));

  const payload = {
    app: 'Rechner L',
    exportedAt: new Date().toISOString(),
    locale,
    totalItems: items.length,
    calculations: sanitizedItems,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const filename = generateExportFilename('json');
  downloadBlob(jsonStr, filename, 'application/json;charset=utf-8;');
}

/**
 * Generates a styled, printable PDF document using jsPDF.
 * Uses sanitized ASCII minus so standard Helvetica font renders cleanly without quotes or corruption.
 */
export function exportToPDF(items: CalculationHistoryItem[], locale: NumberLocale = 'de-DE'): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Bar
  doc.setFillColor(30, 31, 36);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RECHNER L – BERECHNUNGSPROTOKOLL', 15, 14);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 185, 195);
  doc.text(
    `Exportiert am ${formatTimestamp(Date.now(), locale)}  |  ${items.length} Berechnungen`,
    15,
    22
  );

  y = 36;

  // Table Column Positions
  const colX = {
    nr: 15,
    date: 25,
    expr: 68,
    res: 130,
    note: 160,
  };

  // Table Header
  doc.setFillColor(240, 242, 245);
  doc.rect(12, y - 4, pageWidth - 24, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  doc.text('Nr.', colX.nr, y + 1);
  doc.text('Zeitstempel', colX.date, y + 1);
  doc.text('Rechnung', colX.expr, y + 1);
  doc.text('Ergebnis', colX.res, y + 1);
  doc.text('Notiz', colX.note, y + 1);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  items.forEach((item, index) => {
    // Check if new page is needed
    if (y > 270) {
      doc.addPage();
      y = 20;

      // Repeat Table Header
      doc.setFillColor(240, 242, 245);
      doc.rect(12, y - 4, pageWidth - 24, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text('Nr.', colX.nr, y + 1);
      doc.text('Zeitstempel', colX.date, y + 1);
      doc.text('Rechnung', colX.expr, y + 1);
      doc.text('Ergebnis', colX.res, y + 1);
      doc.text('Notiz', colX.note, y + 1);
      y += 10;
      doc.setFont('helvetica', 'normal');
    }

    // Alternating zebra stripe
    if (index % 2 === 1) {
      doc.setFillColor(250, 251, 253);
      doc.rect(12, y - 3.5, pageWidth - 24, 7, 'F');
    }

    doc.setTextColor(100, 100, 100);
    doc.text(`${items.length - index}`, colX.nr, y + 1);

    const { dateStr, timeStr } = splitTimestamp(item.timestamp, locale);
    doc.setTextColor(60, 60, 60);
    doc.text(`${dateStr} ${timeStr}`, colX.date, y + 1);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);

    // Sanitize expression for PDF standard Helvetica font:
    // Ensures minus signs never turn into double quotes or corrupted spacing
    const cleanExpr = sanitizeExpressionForExport(item.expression);
    const safeExpr = cleanExpr.length > 32 ? cleanExpr.substring(0, 30) + '...' : cleanExpr;
    doc.text(safeExpr, colX.expr, y + 1);

    doc.setTextColor(14, 116, 144); // Cyan / Blue for result
    const resStr = formatNumber(item.result, locale);
    doc.text(`= ${resStr}`, colX.res, y + 1);

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(110, 110, 110);
    const safeNote = (item.note || '–').length > 22 ? (item.note || '').substring(0, 20) + '...' : item.note || '–';
    doc.text(safeNote, colX.note, y + 1);
    doc.setFont('helvetica', 'normal');

    y += 7.5;
  });

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Seite ${i} von ${pageCount}  |  Erstellt mit Rechner L (Android PWA)`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  const filename = generateExportFilename('pdf');
  doc.save(filename);
}

/**
 * Copies plain text format to clipboard with sanitized operators.
 */
export async function copyHistoryToClipboard(
  items: CalculationHistoryItem[],
  locale: NumberLocale = 'de-DE'
): Promise<boolean> {
  try {
    const lines = items.map((item) => {
      const timeStr = formatTimestamp(item.timestamp, locale);
      const resStr = formatNumber(item.result, locale);
      const cleanExpr = sanitizeExpressionForExport(item.expression);
      const noteStr = item.note ? ` (${item.note})` : '';
      return `${timeStr}: ${cleanExpr} = ${resStr}${noteStr}`;
    });
    const content = lines.join('\n');
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
