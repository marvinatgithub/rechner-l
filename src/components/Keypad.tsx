import React from 'react';
import { Delete } from 'lucide-react';
import { NumberLocale } from '../types/calculator';

interface KeypadProps {
  onNumber: (digit: string) => void;
  onOperator: (op: string) => void;
  onDecimal: () => void;
  onEquals: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onToggleSign?: () => void;
  onParentheses: () => void;
  onPercent: () => void;
  hasInput: boolean;
  locale: NumberLocale;
  vibrationEnabled: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  onNumber,
  onOperator,
  onDecimal,
  onEquals,
  onClear,
  onBackspace,
  onToggleSign,
  onParentheses,
  onPercent,
  hasInput,
  locale,
  vibrationEnabled,
}) => {
  const triggerHaptic = () => {
    if (vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore on desktop/unsupported
      }
    }
  };

  const handlePress = (action: () => void) => {
    triggerHaptic();
    action();
  };

  // Button styles following Android 14/15 Material Design 3 tokens
  const baseButtonClass =
    'android-ripple flex items-center justify-center rounded-full font-medium transition-all select-none touch-manipulation focus:outline-none';

  // Specific color hierarchies
  const numberClass = `${baseButtonClass} bg-[#282A2F] hover:bg-[#32353B] text-[#E3E2E6] active:bg-[#3C3F46] text-2xl sm:text-3xl`;
  const functionClass = `${baseButtonClass} bg-[#393B43] hover:bg-[#43454E] text-[#C4E7FF] active:bg-[#4D505B] text-xl sm:text-2xl font-normal`;
  const operatorClass = `${baseButtonClass} bg-[#004A77] hover:bg-[#005589] text-[#C2E7FF] active:bg-[#00609B] text-2xl sm:text-3xl font-light`;
  const equalsClass = `${baseButtonClass} bg-[#2F80ED] hover:bg-[#3D8CF2] text-white active:bg-[#1E70DE] text-3xl sm:text-4xl font-normal shadow-md shadow-blue-500/10`;

  const decimalChar = locale === 'de-DE' ? ',' : '.';

  return (
    <div className="w-full grid grid-cols-4 gap-2.5 sm:gap-3 p-3 pb-4">
      {/* Row 1: AC, ( ), %, ÷ */}
      <button
        onClick={() => handlePress(onClear)}
        className={`${functionClass} h-15 sm:h-17`}
        aria-label="Alles löschen"
      >
        AC
      </button>

      <button
        onClick={() => handlePress(onParentheses)}
        className={`${functionClass} h-15 sm:h-17`}
        aria-label="Klammern"
      >
        ( )
      </button>

      <button
        onClick={() => handlePress(onPercent)}
        className={`${functionClass} h-15 sm:h-17`}
        aria-label="Prozent"
      >
        %
      </button>

      <button
        onClick={() => handlePress(() => onOperator('÷'))}
        className={`${operatorClass} h-15 sm:h-17`}
        aria-label="Geteilt durch"
      >
        ÷
      </button>

      {/* Row 2: 7, 8, 9, × */}
      <button
        onClick={() => handlePress(() => onNumber('7'))}
        className={`${numberClass} h-15 sm:h-17`}
      >
        7
      </button>
      <button
        onClick={() => handlePress(() => onNumber('8'))}
        className={`${numberClass} h-15 sm:h-17`}
      >
        8
      </button>
      <button
        onClick={() => handlePress(() => onNumber('9'))}
        className={`${numberClass} h-15 sm:h-17`}
      >
        9
      </button>
      <button
        onClick={() => handlePress(() => onOperator('×'))}
        className={`${operatorClass} h-15 sm:h-17`}
        aria-label="Mal"
      >
        ×
      </button>

      {/* Row 3: 4, 5, 6, − */}
      <button
        onClick={() => handlePress(() => onNumber('4'))}
        className={`${numberClass} h-15 sm:h-17`}
      >
        4
      </button>
      <button
        onClick={() => handlePress(() => onNumber('5'))}
        className={`${numberClass} h-15 sm:h-17`}
      >
        5
      </button>
      <button
        onClick={() => handlePress(() => onNumber('6'))}
        className={`${numberClass} h-15 sm:h-17`}
      >
        6
      </button>
      <button
        onClick={() => handlePress(() => onOperator('−'))}
        className={`${operatorClass} h-15 sm:h-17`}
        aria-label="Minus"
      >
        −
      </button>

      {/* Row 4: 1, 2, 3, + */}
      <button
        onClick={() => handlePress(() => onNumber('1'))}
        className={`${numberClass} h-15 sm:h-17`}
      >
        1
      </button>
      <button
        onClick={() => handlePress(() => onNumber('2'))}
        className={`${numberClass} h-15 sm:h-17`}
      >
        2
      </button>
      <button
        onClick={() => handlePress(() => onNumber('3'))}
        className={`${numberClass} h-15 sm:h-17`}
      >
        3
      </button>
      <button
        onClick={() => handlePress(() => onOperator('+'))}
        className={`${operatorClass} h-15 sm:h-17`}
        aria-label="Plus"
      >
        +
      </button>

      {/* Row 5: 0, , / ., ⌫, = */}
      <button
        onClick={() => handlePress(() => onNumber('0'))}
        className={`${numberClass} h-15 sm:h-17`}
      >
        0
      </button>
      <button
        onClick={() => handlePress(onDecimal)}
        className={`${numberClass} h-15 sm:h-17 font-bold`}
        aria-label="Dezimaltrennzeichen"
      >
        {decimalChar}
      </button>
      <button
        onClick={() => handlePress(onBackspace)}
        className={`${numberClass} h-15 sm:h-17`}
        aria-label="Letztes Zeichen löschen"
        title="Letztes Zeichen löschen"
      >
        <Delete className="w-6 h-6 text-[#E3E2E6]" />
      </button>
      <button
        onClick={() => handlePress(onEquals)}
        className={`${equalsClass} h-15 sm:h-17`}
        aria-label="Ergebnis berechnen"
      >
        =
      </button>
    </div>
  );
};
