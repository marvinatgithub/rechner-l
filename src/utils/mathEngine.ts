/**
 * Safe Mathematical Expression Parser and Evaluator
 * Built specifically for Google Calculator behavior with support for:
 * - Order of operations (PEMDAS / Punkt vor Strich)
 * - Parentheses
 * - Google Calculator percentage semantics:
 *     A + B% => A + (A * B / 100)
 *     A - B% => A - (A * B / 100)
 *     A × B% => A * (B / 100)
 *     A ÷ B% => A / (B / 100)
 *     B% alone => B / 100
 * - Floating point precision correction (no 0.1 + 0.2 = 0.30000000000000004)
 */

type TokenType = 'NUMBER' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'PERCENT';

interface Token {
  type: TokenType;
  value: string;
}

// Clean floating point errors (e.g. 0.1 + 0.2 -> 0.3)
export function sanitizeFloat(num: number): number {
  if (!isFinite(num)) return num;
  return parseFloat(num.toPrecision(12));
}

/**
 * Tokenizes a raw calculation string.
 * Normalizes symbols: '×' -> '*', '÷' -> '/', '−' -> '-', ',' -> '.'
 */
export function tokenize(expression: string): Token[] {
  const normalized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/,/g, '.')
    .replace(/\s+/g, '');

  const tokens: Token[] = [];
  let i = 0;

  while (i < normalized.length) {
    const char = normalized[i];

    // Numbers (digits and decimal point)
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      let hasDot = false;
      while (i < normalized.length && /[0-9.]/.test(normalized[i])) {
        if (normalized[i] === '.') {
          if (hasDot) break;
          hasDot = true;
        }
        numStr += normalized[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    if (char === '%') {
      tokens.push({ type: 'PERCENT', value: '%' });
      i++;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    if (['+', '-', '*', '/'].includes(char)) {
      // Check for unary minus: at start of expression or after operator or left paren
      const prev = tokens[tokens.length - 1];
      if (
        char === '-' &&
        (!prev || prev.type === 'OPERATOR' || prev.type === 'LPAREN')
      ) {
        // Lookahead to see if next is number
        let nextChar = normalized[i + 1];
        if (nextChar && /[0-9.]/.test(nextChar)) {
          i++; // consume '-'
          let numStr = '-';
          let hasDot = false;
          while (i < normalized.length && /[0-9.]/.test(normalized[i])) {
            if (normalized[i] === '.') {
              if (hasDot) break;
              hasDot = true;
            }
            numStr += normalized[i];
            i++;
          }
          tokens.push({ type: 'NUMBER', value: numStr });
          continue;
        }
      }

      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    // Unrecognized char, skip
    i++;
  }

  return tokens;
}

/**
 * Evaluates an expression using the Shunting Yard Algorithm + AST Evaluation.
 * Handles Google-style percentage calculation.
 */
export function evaluateExpression(expression: string): {
  success: boolean;
  result?: number;
  error?: string;
} {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { success: false, error: 'Leer' };
  }

  try {
    const rawTokens = tokenize(trimmed);
    if (rawTokens.length === 0) {
      return { success: false, error: 'Leer' };
    }

    // Auto-close missing right parentheses for live evaluation
    let openCount = 0;
    for (const t of rawTokens) {
      if (t.type === 'LPAREN') openCount++;
      if (t.type === 'RPAREN') openCount--;
    }
    const tokens = [...rawTokens];
    while (openCount > 0) {
      tokens.push({ type: 'RPAREN', value: ')' });
      openCount--;
    }

    // If the expression ends with an operator (e.g. "12 +"), remove trailing operator for evaluation
    while (
      tokens.length > 0 &&
      tokens[tokens.length - 1].type === 'OPERATOR'
    ) {
      tokens.pop();
    }

    if (tokens.length === 0) {
      return { success: false, error: 'Unvollständig' };
    }

    // Pre-process percentages:
    // If pattern: A + B%, change B% to (A * B / 100)
    // If pattern: A - B%, change B% to (A * B / 100)
    // If pattern: A * B%, change B% to (B / 100)
    // If pattern: A / B%, change B% to (B / 100)
    // If pattern: B%, change to (B / 100)
    const processedTokens: Token[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const cur = tokens[i];
      if (cur.type === 'PERCENT') {
        const prev = processedTokens[processedTokens.length - 1];
        if (prev && prev.type === 'NUMBER') {
          const numVal = parseFloat(prev.value);
          // Check if before prev was an operator and base number
          const opToken = processedTokens[processedTokens.length - 2];
          const baseToken = processedTokens[processedTokens.length - 3];

          if (
            opToken &&
            opToken.type === 'OPERATOR' &&
            ['+', '-'].includes(opToken.value) &&
            baseToken &&
            baseToken.type === 'NUMBER'
          ) {
            const baseVal = parseFloat(baseToken.value);
            const percentageVal = (baseVal * numVal) / 100;
            prev.value = percentageVal.toString();
          } else {
            prev.value = (numVal / 100).toString();
          }
        }
      } else {
        processedTokens.push({ ...cur });
      }
    }

    // Shunting yard to RPN (Reverse Polish Notation)
    const outputQueue: Token[] = [];
    const operatorStack: Token[] = [];

    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
    };

    for (let i = 0; i < processedTokens.length; i++) {
      const token = processedTokens[i];

      if (token.type === 'NUMBER') {
        outputQueue.push(token);
      } else if (token.type === 'OPERATOR') {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type === 'OPERATOR' &&
          precedence[operatorStack[operatorStack.length - 1].value] >= precedence[token.value]
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        operatorStack.push(token);
      } else if (token.type === 'LPAREN') {
        operatorStack.push(token);
      } else if (token.type === 'RPAREN') {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type !== 'LPAREN'
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'LPAREN') {
          operatorStack.pop(); // discard '('
        }
      }
    }

    while (operatorStack.length > 0) {
      const top = operatorStack.pop()!;
      if (top.type !== 'LPAREN' && top.type !== 'RPAREN') {
        outputQueue.push(top);
      }
    }

    // Evaluate RPN
    const evalStack: number[] = [];

    for (const token of outputQueue) {
      if (token.type === 'NUMBER') {
        evalStack.push(parseFloat(token.value));
      } else if (token.type === 'OPERATOR') {
        if (evalStack.length < 2) {
          return { success: false, error: 'Syntaxfehler' };
        }
        const b = evalStack.pop()!;
        const a = evalStack.pop()!;

        let res = 0;
        switch (token.value) {
          case '+':
            res = a + b;
            break;
          case '-':
            res = a - b;
            break;
          case '*':
            res = a * b;
            break;
          case '/':
            if (b === 0) {
              return { success: false, error: 'Teilung durch 0 unmöglich' };
            }
            res = a / b;
            break;
          default:
            return { success: false, error: 'Ungültiger Operator' };
        }
        evalStack.push(sanitizeFloat(res));
      }
    }

    if (evalStack.length !== 1) {
      return { success: false, error: 'Syntaxfehler' };
    }

    const finalResult = sanitizeFloat(evalStack[0]);
    if (isNaN(finalResult)) {
      return { success: false, error: 'Ungültig' };
    }

    return { success: true, result: finalResult };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler';
    return { success: false, error: message };
  }
}

/**
 * Toggles the sign (plus/minus) of the last number in an expression.
 */
export function toggleSign(expr: string): string {
  if (!expr) return '-';

  // Find the last number token or parenthesized negative number
  const regex = /(-?\d+(?:[.,]\d+)?|\(-?\d+(?:[.,]\d+)?\))$/;
  const match = expr.match(regex);

  if (!match) {
    return expr + '(-';
  }

  const matchedStr = match[0];
  const startIndex = expr.length - matchedStr.length;
  const prefix = expr.substring(0, startIndex);

  if (matchedStr.startsWith('(-') && matchedStr.endsWith(')')) {
    // (-X) -> X
    return prefix + matchedStr.slice(2, -1);
  } else if (matchedStr.startsWith('-')) {
    // -X -> X
    return prefix + matchedStr.substring(1);
  } else {
    // X -> (-X)
    return prefix + `(-${matchedStr})`;
  }
}
