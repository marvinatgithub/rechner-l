import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  FileText,
  FileCode,
  FileDown,
  X,
  Share2,
} from 'lucide-react';
import { CalculationHistoryItem, ExportFormat, NumberLocale } from '../types/calculator';
import {
  exportToCSV,
  exportToTXT,
  exportToPDF,
  exportToJSON,
  copyHistoryToClipboard,
} from '../utils/exporter';
import { formatNumber, splitTimestamp } from '../utils/formatter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: CalculationHistoryItem[];
  locale: NumberLocale;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  history,
  locale,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    switch (selectedFormat) {
      case 'csv':
        exportToCSV(history, locale);
        break;
      case 'txt':
        exportToTXT(history, locale);
        break;
      case 'pdf':
        exportToPDF(history, locale);
        break;
      case 'json':
        exportToJSON(history, locale);
        break;
    }
  };

  const handleCopy = async () => {
    const success = await copyHistoryToClipboard(history, locale);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatOptions: {
    id: ExportFormat;
    title: string;
    ext: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'csv',
      title: 'CSV-Tabelle',
      ext: '.csv',
      desc: 'Optimiert für Excel & LibreOffice mit Semikolon (;) und UTF-8',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'txt',
      title: 'Textprotokoll',
      ext: '.txt',
      desc: 'Kompakte, lesbare Aufstellung aller Rechnungen',
      icon: <FileText className="w-5 h-5 text-sky-400" />,
    },
    {
      id: 'pdf',
      title: 'PDF-Bericht',
      ext: '.pdf',
      desc: 'Formatiertes A4-Dokument mit Tabelle und Zeitstempeln',
      icon: <FileDown className="w-5 h-5 text-rose-400" />,
    },
    {
      id: 'json',
      title: 'JSON-Export',
      ext: '.json',
      desc: 'Strukturierte Rohdaten für Entwickler und Backups',
      icon: <FileCode className="w-5 h-5 text-amber-400" />,
    },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#1E1F24] border border-stone-700/80 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-semibold text-stone-100">
              Verlauf exportieren
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info banner */}
        <div className="my-3 py-2 px-3 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>Umfang: {history.length} Berechnungen</span>
          <span className="font-mono text-[11px] text-stone-500">
            {locale === 'de-DE' ? 'Format: DIN / DE' : 'Format: International'}
          </span>
        </div>

        {/* Format Selector List */}
        <div className="space-y-2 mb-4 overflow-y-auto">
          {formatOptions.map((opt) => (
            <div
              key={opt.id}
              onClick={() => setSelectedFormat(opt.id)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                selectedFormat === opt.id
                  ? 'bg-sky-950/40 border-sky-500 text-stone-100'
                  : 'bg-stone-900/40 border-stone-800/80 hover:border-stone-700 text-stone-400'
              }`}
            >
              <div className="p-2 rounded-xl bg-stone-800/80 shrink-0">
                {opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-200">
                    {opt.title}
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                    {opt.ext}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5 leading-snug">
                  {opt.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Live Preview Box */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
            Vorschau ({selectedFormat.toUpperCase()})
          </div>
          <div className="bg-stone-950/80 border border-stone-800/80 rounded-xl p-2.5 font-mono text-[11px] text-stone-300 max-h-24 overflow-y-auto whitespace-pre leading-relaxed select-all">
            {selectedFormat === 'csv' && (
              <>
                Datum;Uhrzeit;Ausdruck;Ergebnis;Notiz{'\n'}
                {history.slice(0, 2).map((item) => {
                  const { dateStr, timeStr } = splitTimestamp(item.timestamp, locale);
                  return `${dateStr};${timeStr};"${item.expression}";"${formatNumber(item.result, locale)}";"${item.note || ''}"\n`;
                })}
                {history.length > 2 && '...'}
              </>
            )}
            {selectedFormat === 'txt' && (
              <>
                RECHNER L – BERECHNUNGSPROTOKOLL{'\n'}
                {history.slice(0, 2).map((item) => `${item.expression} = ${formatNumber(item.result, locale)}${item.note ? ` (${item.note})` : ''}\n`)}
                {history.length > 2 && '...'}
              </>
            )}
            {selectedFormat === 'pdf' && (
              <>
                [PDF-Dokument] A4 Hochformat{'\n'}
                Titel: RECHNER L BERECHNUNGSPROTOKOLL{'\n'}
                Spalten: Nr. | Zeitstempel | Rechnung | Ergebnis | Notiz{'\n'}
                Umfang: {history.length} Einträge
              </>
            )}
            {selectedFormat === 'json' && (
              <>
                {JSON.stringify(
                  {
                    app: 'Rechner L',
                    count: history.length,
                    first: history[0] || null,
                  },
                  null,
                  2
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            title="In Zwischenablage kopieren"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Kopiert!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Kopieren</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 px-3 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-sky-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Herunterladen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
