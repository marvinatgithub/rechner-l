import React, { useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { NumberLocale } from '../types/calculator';
import { formatExpressionForDisplay, formatNumber } from '../utils/formatter';

interface DisplayProps {
  expression: string;
  previewResult: number | null;
  hasError: boolean;
  errorMessage?: string;
  locale: NumberLocale;
  onBackspace?: () => void;
  onClear: () => void;
  lastCalculatedExpression?: string;
  isResultEvaluated: boolean;
}

export const Display: React.FC<DisplayProps> = ({
  expression,
  previewResult,
  hasError,
  errorMessage,
  locale,
  lastCalculatedExpression,
  isResultEvaluated,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto-scroll expression to right as user types
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [expression, previewResult]);

  const copyCurrent = () => {
    const textToCopy = isResultEvaluated
      ? expression
      : previewResult !== null
      ? formatNumber(previewResult, locale)
      : expression || '0';

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  // Adaptive font size calculation based on expression length
  const getExpressionFontSize = () => {
    const len = expression.length;
    if (isResultEvaluated) {
      if (len > 14) return 'text-3xl sm:text-4xl';
      if (len > 10) return 'text-4xl sm:text-5xl';
      return 'text-5xl sm:text-6xl';
    } else {
      if (len > 24) return 'text-2xl sm:text-3xl';
      if (len > 14) return 'text-3xl sm:text-4xl';
      return 'text-4xl sm:text-5xl';
    }
  };

  const displayExpr = formatExpressionForDisplay(expression, locale);

  return (
    <div className="w-full flex-1 flex flex-col justify-end px-5 py-3 relative min-h-[170px] select-text">
      {/* Copy notification badge */}
      {copied && (
        <div className="absolute top-2 left-5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/90 border border-sky-500/40 text-sky-200 text-xs font-medium animate-fade-in">
          <Check className="w-3.5 h-3.5 text-sky-400" />
          <span>In Zwischenablage kopiert</span>
        </div>
      )}

      {/* Copy action button on top right */}
      <div className="flex items-center justify-end gap-2 mb-1 z-10">
        {(expression || previewResult !== null) && (
          <button
            onClick={copyCurrent}
            title="Ergebnis kopieren"
            aria-label="Ergebnis kopieren"
            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-full transition-colors active:scale-95"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upper line: Last calculation or full expression when result is shown */}
      {isResultEvaluated && lastCalculatedExpression && (
        <div className="text-right text-stone-400 text-sm sm:text-base font-normal tracking-wide overflow-x-auto whitespace-nowrap mb-1">
          {formatExpressionForDisplay(lastCalculatedExpression, locale)}
        </div>
      )}

      {/* Main active expression line */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto whitespace-nowrap text-right py-1 scrollbar-none"
      >
        <span
          className={`font-semibold tracking-tight text-stone-100 transition-all duration-150 tabular-nums ${getExpressionFontSize()}`}
        >
          {displayExpr || (isResultEvaluated ? '' : '0')}
        </span>
      </div>

      {/* Lower line: Live preview result or error message */}
      <div className="min-h-[36px] flex items-center justify-end text-right mt-1">
        {hasError ? (
          <span className="text-rose-400 text-sm sm:text-base font-medium">
            {errorMessage || 'Ungültiges Format'}
          </span>
        ) : !isResultEvaluated && previewResult !== null && expression.length > 0 ? (
          <span className="text-stone-400 text-2xl sm:text-3xl font-medium tracking-tight tabular-nums animate-fade-in">
            = {formatNumber(previewResult, locale)}
          </span>
        ) : null}
      </div>
    </div>
  );
};
