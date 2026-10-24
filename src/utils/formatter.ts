import { NumberLocale } from '../types/calculator';

/**
 * Formats a numeric value with standard German or international grouping and decimals.
 */
export function formatNumber(
  value: number,
  locale: NumberLocale = 'de-DE',
  maxDecimals: number = 8
): string {
  if (isNaN(value)) return 'Fehler';
  if (!isFinite(value)) return '∞';

  // Avoid scientific notation for reasonable everyday numbers
  if (Math.abs(value) > 1e15 || (Math.abs(value) < 1e-6 && value !== 0)) {
    return value.toExponential(4).replace('.', locale === 'de-DE' ? ',' : '.');
  }

  // Format with Intl
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: maxDecimals,
    useGrouping: true,
  }).format(value);
}

/**
 * Formats an expression string for UI display.
 * Replaces dot decimals with commas if German locale is selected,
 * and formats numbers with thousands separators while keeping operators clean.
 */
export function formatExpressionForDisplay(
  rawExpr: string,
  locale: NumberLocale = 'de-DE'
): string {
  if (!rawExpr) return '';

  const decimalSeparator = locale === 'de-DE' ? ',' : '.';
  const otherSeparator = locale === 'de-DE' ? '.' : ',';

  // Replace standard internal dot with comma for German display
  // Also keep clean spacing around standard binary operators
  return rawExpr
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−')
    .replace(new RegExp(`\\${otherSeparator}`, 'g'), decimalSeparator);
}

/**
 * Format timestamp into German readable time: "20. Okt. 2026, 14:32"
 */
export function formatTimestamp(timestamp: number, locale: NumberLocale = 'de-DE'): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format timestamp into Date and Time parts separately (useful for table export)
 */
export function splitTimestamp(timestamp: number, locale: NumberLocale = 'de-DE') {
  const date = new Date(timestamp);
  const dateStr = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

  const timeStr = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);

  return { dateStr, timeStr };
}

/**
 * Categorize a timestamp into human date buckets for German users:
 * "Heute", "Gestern", "Diese Woche", "Diesen Monat", "Älter"
 */
export function getDateGroupLabel(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Heute';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Gestern';

  // Within past 7 days
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return 'Diese Woche';

  // Same month & year
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return 'Diesen Monat';
  }

  // Older: Month and Year
  return new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}
