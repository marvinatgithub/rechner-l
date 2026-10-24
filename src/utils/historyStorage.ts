import { CalculationHistoryItem, NumberLocale } from '../types/calculator';
import { formatNumber } from './formatter';

const STORAGE_KEY = 'rechner_pro_history_v1';
const SETTINGS_KEY = 'rechner_pro_settings_v1';

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read settings from storage', e);
  }
  return {
    locale: 'de-DE' as NumberLocale,
    vibrationEnabled: true,
    maxDecimals: 8,
  };
}

export function saveStoredSettings(settings: {
  locale: NumberLocale;
  vibrationEnabled: boolean;
  maxDecimals: number;
}) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to storage', e);
  }
}

// Sample calculations for German users (e.g., Mehrwertsteuer, Handwerkerrechnung, Rabatt)
const INITIAL_SAMPLE_HISTORY: CalculationHistoryItem[] = [
  {
    id: 'sample-1',
    expression: '450 + 19%',
    result: 535.5,
    formattedResult: '535,50',
    timestamp: Date.now() - 1000 * 60 * 35, // 35 minutes ago
    note: 'Nettobetrag + 19% MwSt.',
  },
  {
    id: 'sample-2',
    expression: '1.240,80 − 15%',
    result: 1054.68,
    formattedResult: '1.054,68',
    timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
    note: 'Aktionsrabatt Großhändler',
  },
  {
    id: 'sample-3',
    expression: '12 × 42,50 + 85',
    result: 595,
    formattedResult: '595',
    timestamp: Date.now() - 1000 * 60 * 60 * 26, // yesterday
    note: 'Materialkosten & Anfahrt',
  },
  {
    id: 'sample-4',
    expression: '2.400 ÷ 3',
    result: 800,
    formattedResult: '800',
    timestamp: Date.now() - 1000 * 60 * 60 * 52, // 2 days ago
    note: 'Mietanteil 3 Personen',
  },
];

export function getStoredHistory(currentLocale: NumberLocale = 'de-DE'): CalculationHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } else {
      // First launch: initialize with sample items so the user can test exports right away
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_HISTORY));
      return INITIAL_SAMPLE_HISTORY;
    }
  } catch (e) {
    console.error('Failed to read calculation history', e);
  }
  return [];
}

export function saveHistory(items: CalculationHistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to persist history', e);
  }
}

export function addCalculationToHistory(
  expression: string,
  result: number,
  locale: NumberLocale = 'de-DE',
  note?: string
): CalculationHistoryItem {
  const currentHistory = getStoredHistory(locale);
  const newItem: CalculationHistoryItem = {
    id: `calc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    expression,
    result,
    formattedResult: formatNumber(result, locale),
    timestamp: Date.now(),
    note: note || '',
  };

  // Add to top of list (unlimited storage)
  const updated = [newItem, ...currentHistory];
  saveHistory(updated);
  return newItem;
}

export function updateHistoryNote(id: string, note: string): CalculationHistoryItem[] {
  const current = getStoredHistory();
  const updated = current.map((item) =>
    item.id === id ? { ...item, note } : item
  );
  saveHistory(updated);
  return updated;
}

export function deleteHistoryItem(id: string): CalculationHistoryItem[] {
  const current = getStoredHistory();
  const updated = current.filter((item) => item.id !== id);
  saveHistory(updated);
  return updated;
}

export function clearHistory(): void {
  saveHistory([]);
}
