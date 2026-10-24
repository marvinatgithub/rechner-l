import React, { useState, useMemo } from 'react';
import {
  Download,
  Trash2,
  X,
  Search,
  Calendar,
  MessageSquare,
  ArrowDownLeft,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { CalculationHistoryItem, NumberLocale } from '../types/calculator';
import {
  getDateGroupLabel,
  formatTimestamp,
  formatExpressionForDisplay,
  formatNumber,
} from '../utils/formatter';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: CalculationHistoryItem[];
  locale: NumberLocale;
  onLoadExpression: (expr: string) => void;
  onLoadResult: (res: number) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  onOpenExport: () => void;
  onUpdateNote: (id: string, note: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  locale,
  onLoadExpression,
  onLoadResult,
  onDeleteItem,
  onClearHistory,
  onOpenExport,
  onUpdateNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Filter history by search query
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter(
      (item) =>
        item.expression.toLowerCase().includes(q) ||
        item.result.toString().includes(q) ||
        formatNumber(item.result, locale).toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q))
    );
  }, [history, searchQuery, locale]);

  // Group items by date bucket ("Heute", "Gestern", etc.)
  const groupedHistory = useMemo(() => {
    const groups: { [group: string]: CalculationHistoryItem[] } = {};
    for (const item of filteredHistory) {
      const groupName = getDateGroupLabel(item.timestamp);
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(item);
    }
    return groups;
  }, [filteredHistory]);

  const handleStartEditNote = (item: CalculationHistoryItem) => {
    setEditingNoteId(item.id);
    setNoteText(item.note || '');
  };

  const handleSaveNote = (id: string) => {
    onUpdateNote(id, noteText.trim());
    setEditingNoteId(null);
  };

  const copyItem = (item: CalculationHistoryItem) => {
    const text = `${item.expression} = ${formatNumber(item.result, locale)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 bg-[#121316]/95 backdrop-blur-md flex flex-col transition-all duration-200">
      {/* Android Sheet Top Drag Handle */}
      <div className="w-full pt-2 pb-1 flex justify-center">
        <div className="w-10 h-1 bg-stone-600 rounded-full" />
      </div>

      {/* Header Bar */}
      <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-semibold text-stone-100">
            Verlauf
            <span className="ml-2 text-xs font-normal text-stone-400 font-mono">
              ({history.length} Einträge · ohne Frist)
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {history.length > 0 && (
            <>
              <button
                onClick={onOpenExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-950/80 border border-sky-600/30 text-sky-300 hover:bg-sky-900/60 text-xs font-medium transition-colors"
                title="Verlauf als CSV, TXT, PDF oder JSON exportieren"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportieren</span>
              </button>

              <button
                onClick={() => setConfirmClearOpen(true)}
                className="p-1.5 rounded-full text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                title="Verlauf leeren"
                aria-label="Verlauf leeren"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors ml-1"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      {history.length > 2 && (
        <div className="px-5 py-2.5 border-b border-stone-800/80 bg-stone-900/50">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Berechnung oder Notiz suchen..."
              className="w-full bg-stone-800/80 border border-stone-700/60 rounded-xl pl-9 pr-8 py-1.5 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-sky-500/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-stone-400 hover:text-stone-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* History Items Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400">
            <div className="w-14 h-14 rounded-2xl bg-stone-800/60 flex items-center justify-center mb-3">
              <Calendar className="w-7 h-7 text-stone-500" />
            </div>
            <p className="text-base font-medium text-stone-200 mb-1">
              Noch keine Berechnungen
            </p>
            <p className="text-xs text-stone-500 max-w-xs">
              Ihre Rechnungen werden hier dauerhaft ohne Zeitbeschränkung gespeichert und können jederzeit exportiert werden.
            </p>
          </div>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-sm">
            Keine Berechnungen gefunden für &quot;{searchQuery}&quot;
          </div>
        ) : (
          Object.entries(groupedHistory).map(([groupTitle, items]) => (
            <div key={groupTitle} className="space-y-2">
              {/* Group Label */}
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 px-1 pt-1">
                {groupTitle}
              </div>

              {/* Items in this group */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#1E1F24] border border-stone-800/80 hover:border-stone-700 transition-all flex flex-col gap-2 relative group"
                  >
                    {/* Top Row: Timestamp and quick action buttons */}
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>{formatTimestamp(item.timestamp, locale)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyItem(item)}
                          className="p-1 text-stone-400 hover:text-sky-300 rounded hover:bg-stone-800 transition-colors"
                          title="Rechnung & Ergebnis kopieren"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 text-stone-400 hover:text-rose-400 rounded hover:bg-stone-800 transition-colors"
                          title="Eintrag entfernen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expression */}
                    <div
                      onClick={() => {
                        onLoadExpression(item.expression);
                        onClose();
                      }}
                      className="text-right text-stone-300 text-sm hover:text-sky-300 cursor-pointer transition-colors overflow-x-auto whitespace-nowrap scrollbar-none font-mono"
                      title="Ausdruck in den Rechner laden"
                    >
                      {formatExpressionForDisplay(item.expression, locale)}
                    </div>

                    {/* Result */}
                    <div
                      onClick={() => {
                        onLoadResult(item.result);
                        onClose();
                      }}
                      className="text-right text-sky-400 text-2xl font-semibold tracking-tight hover:text-sky-300 cursor-pointer transition-colors tabular-nums"
                      title="Ergebnis übernehmen"
                    >
                      = {formatNumber(item.result, locale)}
                    </div>

                    {/* Note row */}
                    {editingNoteId === item.id ? (
                      <div className="flex items-center gap-1.5 pt-1 border-t border-stone-800/80">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="z.B. Materialkosten, MwSt."
                          className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-200 focus:outline-none focus:border-sky-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveNote(item.id);
                            if (e.key === 'Escape') setEditingNoteId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveNote(item.id)}
                          className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium"
                        >
                          Speichern
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1 border-t border-stone-800/60 text-xs">
                        {item.note ? (
                          <div
                            onClick={() => handleStartEditNote(item)}
                            className="flex items-center gap-1.5 text-stone-300 hover:text-sky-300 cursor-pointer truncate"
                            title="Notiz bearbeiten"
                          >
                            <MessageSquare className="w-3 h-3 text-sky-400 shrink-0" />
                            <span className="truncate italic">{item.note}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditNote(item)}
                            className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-300 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Notiz hinzufügen</span>
                          </button>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-stone-500 ml-auto">
                          <button
                            onClick={() => {
                              onLoadResult(item.result);
                              onClose();
                            }}
                            className="flex items-center gap-1 hover:text-stone-300"
                            title="Als Startwert nutzen"
                          >
                            <ArrowDownLeft className="w-3 h-3 text-stone-400" />
                            <span>Übernehmen</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Dialog for Clearing History */}
      {confirmClearOpen && (
        <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-6 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#1E1F24] border border-stone-700 rounded-3xl p-5 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 text-rose-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-stone-100">
              Verlauf unwiderruflich leeren?
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Alle {history.length} gespeicherten Berechnungen werden gelöscht. Sie können den Verlauf vorher als Datei exportieren.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setConfirmClearOpen(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
              >
                Alles löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
