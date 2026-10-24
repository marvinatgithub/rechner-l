export type NumberLocale = 'de-DE' | 'en-US';

export interface CalculationHistoryItem {
  id: string;
  expression: string;         // e.g. "1250 + 350 × 2"
  result: number;             // numeric result
  formattedResult: string;    // formatted string according to active locale e.g. "1.950"
  timestamp: number;          // unix timestamp in ms
  note?: string;              // optional user note
}

export type ExportFormat = 'csv' | 'txt' | 'pdf' | 'json';

export interface CalculatorSettings {
  locale: NumberLocale;
  vibrationEnabled: boolean;
  maxDecimals: number;
}
