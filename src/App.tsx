/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  Download,
  Settings as SettingsIcon,
  MoreVertical,
  RotateCcw,
  Smartphone,
  Monitor,
  Share2,
} from 'lucide-react';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { AndroidNavBar } from './components/AndroidNavBar';
import { Display } from './components/Display';
import { Keypad } from './components/Keypad';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { CalculationHistoryItem, CalculatorSettings } from './types/calculator';
import { evaluateExpression, toggleSign } from './utils/mathEngine';
import {
  getStoredHistory,
  addCalculationToHistory,
  deleteHistoryItem,
  clearHistory,
  updateHistoryNote,
  getStoredSettings,
  saveStoredSettings,
} from './utils/historyStorage';
import { formatNumber } from './utils/formatter';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  const [expression, setExpression] = useState<string>('');
  const [isResultEvaluated, setIsResultEvaluated] = useState<boolean>(false);
  const [lastCalculatedExpression, setLastCalculatedExpression] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Modals and Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Frame simulation mode on desktop: 'phone' or 'fullscreen'
  const [frameMode, setFrameMode] = useState<'phone' | 'fullscreen'>('phone');

  // App settings & history
  const [settings, setSettings] = useState<CalculatorSettings>(getStoredSettings());
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() =>
    getStoredHistory(settings.locale)
  );

  const { isInstallable, install } = usePWAInstall();

  // Evaluate live preview on the fly as expression changes
  const previewResult = useMemo(() => {
    if (!expression || isResultEvaluated) return null;
    // Don't preview single numbers without operators
    if (!/[+−×÷\/*%)]/.test(expression)) return null;

    const evalResult = evaluateExpression(expression);
    if (evalResult.success && evalResult.result !== undefined) {
      return evalResult.result;
    }
    return null;
  }, [expression, isResultEvaluated]);

  // Handle number button press
  const handleNumber = useCallback(
    (digit: string) => {
      setHasError(false);
      setErrorMessage('');

      if (isResultEvaluated) {
        // User starts entering fresh number right after evaluation
        setExpression(digit);
        setIsResultEvaluated(false);
        return;
      }

      setExpression((prev) => {
        // Prevent leading multiple zeroes
        if (prev === '0' && digit === '0') return '0';
        if (prev === '0' && digit !== '0') return digit;
        return prev + digit;
      });
    },
    [isResultEvaluated]
  );

  // Handle operator button press (÷, ×, −, +)
  const handleOperator = useCallback(
    (op: string) => {
      setHasError(false);
      setErrorMessage('');

      if (isResultEvaluated) {
        // Continue calculation using the evaluated result
        setIsResultEvaluated(false);
        setExpression((prev) => prev + ` ${op} `);
        return;
      }

      setExpression((prev) => {
        if (!prev) {
          if (op === '−') return '−';
          return '';
        }

        const trimmed = prev.trim();
        const lastChar = trimmed[trimmed.length - 1];

        // Replace consecutive operator
        if (['÷', '×', '−', '+', '/', '*'].includes(lastChar)) {
          const cut = trimmed.replace(/[÷×−+\/*]\s*$/, '');
          return cut + ` ${op} `;
        }

        return prev + ` ${op} `;
      });
    },
    [isResultEvaluated]
  );

  // Handle decimal separator press (, or .)
  const handleDecimal = useCallback(() => {
    setHasError(false);
    setErrorMessage('');

    const decChar = settings.locale === 'de-DE' ? ',' : '.';

    if (isResultEvaluated) {
      setExpression(`0${decChar}`);
      setIsResultEvaluated(false);
      return;
    }

    setExpression((prev) => {
      if (!prev) return `0${decChar}`;

      // Look at the current trailing number segment
      const segments = prev.split(/[\s+−×÷\/*()]+/);
      const currentSegment = segments[segments.length - 1];

      if (currentSegment.includes(',') || currentSegment.includes('.')) {
        return prev; // already has a decimal
      }

      if (!currentSegment) {
        return prev + `0${decChar}`;
      }

      return prev + decChar;
    });
  }, [isResultEvaluated, settings.locale]);

  // Handle Parentheses ( )
  const handleParentheses = useCallback(() => {
    setHasError(false);
    setErrorMessage('');

    setExpression((prev) => {
      if (!prev) return '(';

      let openCount = 0;
      let closeCount = 0;
      for (const char of prev) {
        if (char === '(') openCount++;
        if (char === ')') closeCount++;
      }

      const trimmed = prev.trim();
      const lastChar = trimmed[trimmed.length - 1];

      // If after operator or another open paren, open a new parenthesis
      if (['+', '−', '×', '÷', '(', '/', '*'].includes(lastChar)) {
        return prev + '(';
      }

      // If openCount > closeCount and lastChar is number or closed paren, close it
      if (openCount > closeCount) {
        return prev + ')';
      }

      // Default: multiply with next parenthesized group
      return prev + ' × (';
    });
    setIsResultEvaluated(false);
  }, []);

  // Handle Percent %
  const handlePercent = useCallback(() => {
    setHasError(false);
    setErrorMessage('');

    setExpression((prev) => {
      if (!prev) return '';
      const trimmed = prev.trim();
      const lastChar = trimmed[trimmed.length - 1];
      if (/[0-9)]/.test(lastChar)) {
        return prev + '%';
      }
      return prev;
    });
    setIsResultEvaluated(false);
  }, []);

  // Handle Sign Toggle ±
  const handleToggleSign = useCallback(() => {
    setHasError(false);
    setErrorMessage('');

    setExpression((prev) => toggleSign(prev));
  }, []);

  // Handle Clear / AC
  const handleClear = useCallback(() => {
    setExpression('');
    setHasError(false);
    setErrorMessage('');
    setIsResultEvaluated(false);
  }, []);

  // Handle Backspace ⌫
  const handleBackspace = useCallback(() => {
    setHasError(false);
    setErrorMessage('');

    if (isResultEvaluated) {
      handleClear();
      return;
    }

    setExpression((prev) => {
      if (!prev) return '';
      // If trailing spaces around operator e.g. " + ", remove cleanly
      if (/\s[+−×÷\/*]\s$/.test(prev)) {
        return prev.slice(0, -3);
      }
      return prev.slice(0, -1);
    });
  }, [isResultEvaluated, handleClear]);

  // Handle Equals =
  const handleEquals = useCallback(() => {
    if (!expression.trim()) return;

    const evalResult = evaluateExpression(expression);

    if (evalResult.success && evalResult.result !== undefined) {
      const resultVal = evalResult.result;
      const formattedRes = formatNumber(resultVal, settings.locale);

      // Save to indefinite history log
      const newItem = addCalculationToHistory(
        expression,
        resultVal,
        settings.locale
      );
      setHistory((prev) => [newItem, ...prev]);

      setLastCalculatedExpression(expression);
      setExpression(formattedRes);
      setIsResultEvaluated(true);
      setHasError(false);
      setErrorMessage('');
    } else {
      setHasError(true);
      setErrorMessage(evalResult.error || 'Syntaxfehler');
    }
  }, [expression, settings.locale]);

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in modal inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleNumber(e.key);
      } else if (e.key === ',' || e.key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleOperator('−');
      } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === '(' || e.key === ')') {
        e.preventDefault();
        handleParentheses();
      } else if (e.key === '%') {
        e.preventDefault();
        handlePercent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNumber,
    handleDecimal,
    handleOperator,
    handleEquals,
    handleBackspace,
    handleClear,
    handleParentheses,
    handlePercent,
  ]);

  // History Actions
  const handleLoadExpression = (expr: string) => {
    setExpression(expr);
    setIsResultEvaluated(false);
    setHasError(false);
  };

  const handleLoadResult = (res: number) => {
    setExpression(formatNumber(res, settings.locale));
    setIsResultEvaluated(true);
    setHasError(false);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleClearAllHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleUpdateNote = (id: string, note: string) => {
    const updated = updateHistoryNote(id, note);
    setHistory(updated);
  };

  const handleUpdateSettings = (partial: Partial<CalculatorSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  return (
    <div className="min-h-screen w-full bg-[#0C0D0F] flex flex-col items-center justify-center sm:p-4 text-[#E3E2E6] font-sans antialiased overflow-x-hidden">
      {/* Top Bar for Desktop Preview / Viewport Switcher */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-2 px-2 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-300">Rechner L</span>
          <span className="text-stone-500">·</span>
          <span className="text-[11px] bg-stone-800/80 px-2 py-0.5 rounded-full text-stone-300">
            Google Pixel Style
          </span>
        </div>

        <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-lg p-0.5">
          <button
            onClick={() => setFrameMode('phone')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] transition-colors ${
              frameMode === 'phone'
                ? 'bg-stone-800 text-stone-100 font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Smartphone-Ansicht"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pixel</span>
          </button>
          <button
            onClick={() => setFrameMode('fullscreen')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] transition-colors ${
              frameMode === 'fullscreen'
                ? 'bg-stone-800 text-stone-100 font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Breite Vollbild-Ansicht"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Vollbild</span>
          </button>
        </div>
      </div>

      {/* Main Native Calculator Container */}
      <div
        className={`w-full flex flex-col bg-[#121316] relative transition-all duration-300 ${
          frameMode === 'phone'
            ? 'sm:max-w-[420px] sm:h-[860px] sm:max-h-[95vh] sm:rounded-[44px] sm:border-[8px] sm:border-[#22242A] sm:shadow-2xl sm:shadow-black/80 overflow-hidden'
            : 'max-w-2xl min-h-screen sm:min-h-[90vh] sm:rounded-3xl sm:border sm:border-stone-800'
        } h-[100dvh]`}
      >
        {/* Pixel Front Camera Cutout Simulation (in phone frame mode) */}
        {frameMode === 'phone' && (
          <div className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-black z-40 border border-stone-800/60" />
        )}

        {/* Android System Status Bar */}
        <AndroidStatusBar />

        {/* Google Calculator Top App Bar */}
        <div className="w-full flex items-center justify-between px-5 py-2 select-none z-20">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-normal tracking-tight text-stone-200">
              Rechner L
            </h1>
          </div>

          <div className="flex items-center gap-1 relative">
            {/* History Shortcut Button */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 rounded-full transition-colors relative"
              title="Verlauf öffnen (unbegrenzt)"
              aria-label="Verlauf öffnen"
            >
              <History className="w-5 h-5 text-sky-400" />
            </button>

            {/* Export Shortcut Button */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 rounded-full transition-colors"
              title="Verlauf als Datei exportieren"
              aria-label="Exportieren"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Three-dots Menu Trigger */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 rounded-full transition-colors"
              aria-label="Menü"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu (Android Material Popover) */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl bg-[#1E1F24] border border-stone-700/80 py-1.5 shadow-2xl space-y-0.5 animate-fade-in">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsHistoryOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-stone-200 hover:bg-stone-800/80 flex items-center gap-3 transition-colors"
                  >
                    <History className="w-4 h-4 text-sky-400" />
                    <span>Verlauf ({history.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsExportOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-stone-200 hover:bg-stone-800/80 flex items-center gap-3 transition-colors"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Verlauf exportieren...</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-stone-200 hover:bg-stone-800/80 flex items-center gap-3 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4 text-stone-400" />
                    <span>Einstellungen (Format, Haptik)</span>
                  </button>

                  {isInstallable && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        install();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs text-stone-200 hover:bg-stone-800/80 flex items-center gap-3 transition-colors border-t border-stone-800"
                    >
                      <Smartphone className="w-4 h-4 text-sky-400" />
                      <span>App installieren</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Display Section */}
        <Display
          expression={expression}
          previewResult={previewResult}
          hasError={hasError}
          errorMessage={errorMessage}
          locale={settings.locale}
          onBackspace={handleBackspace}
          onClear={handleClear}
          lastCalculatedExpression={lastCalculatedExpression}
          isResultEvaluated={isResultEvaluated}
        />

        {/* Keypad Section */}
        <div className="w-full mt-auto">
          <Keypad
            onNumber={handleNumber}
            onOperator={handleOperator}
            onDecimal={handleDecimal}
            onEquals={handleEquals}
            onClear={handleClear}
            onBackspace={handleBackspace}
            onToggleSign={handleToggleSign}
            onParentheses={handleParentheses}
            onPercent={handlePercent}
            hasInput={expression.length > 0}
            locale={settings.locale}
            vibrationEnabled={settings.vibrationEnabled}
          />

          {/* Android Navigation Bar Indicator */}
          <AndroidNavBar />
        </div>

        {/* History Drawer Overlay */}
        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          locale={settings.locale}
          onLoadExpression={handleLoadExpression}
          onLoadResult={handleLoadResult}
          onDeleteItem={handleDeleteHistoryItem}
          onClearHistory={handleClearAllHistory}
          onOpenExport={() => {
            setIsHistoryOpen(false);
            setIsExportOpen(true);
          }}
          onUpdateNote={handleUpdateNote}
        />

        {/* Export Modal Dialog */}
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          history={history}
          locale={settings.locale}
        />

        {/* Settings Modal Dialog */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onTriggerInstall={install}
          isInstallable={isInstallable}
        />
      </div>
    </div>
  );
}
