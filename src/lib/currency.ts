/**
 * Centralised currency helpers to guarantee:
 * - Raw numbers flow from API to UI
 * - All formatting happens in one place
 * - Defensive coercion when strings sneak through
 * - No hardcoded symbols sprinkled across the app
 */

const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_CURRENCY_LOCALE || 'en-IN';
const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY_CODE || 'INR';
const EXPECTED_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '\u20B9';
const FALLBACK_SYMBOLS = ['₱', '$', '€', '£', '¥', '₩'];

type FormatOptions = Pick<Intl.NumberFormatOptions, 'minimumFractionDigits' | 'maximumFractionDigits'>;

/**
 * Convert any incoming value to a finite number.
 * Logs in nonâ€‘production so we can trace bad data quickly.
 */
export function ensureNumber(value: unknown, context: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    // Remove any currency symbols/letters/spaces, keep digits, dot, minus
    const normalised = value.replace(new RegExp(`[${FALLBACK_SYMBOLS.join('')}₹\\s]`, 'g'), '').replace(/[^\d.-]/g, '');
    const parsed = Number(normalised);
    if (Number.isFinite(parsed)) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[currency] coerced string to number in ${context}:`, value, '→', parsed);
      }
      return parsed;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(`[currency] non-numeric value in ${context}:`, value);
  }

  return 0;
}

/**
 * Format currency into parts so UI can style symbol/value separately.
 */
export function formatCurrencyParts(
  value: unknown,
  options: FormatOptions = {},
) {
  const amount = ensureNumber(value, 'formatCurrencyParts');
  // Force symbol to INR to avoid any locale/currency drift (e.g., peso showing up)
  const symbol = EXPECTED_SYMBOL;
  const numeric = amount.toLocaleString(DEFAULT_LOCALE, {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
  });

  return { symbol, numeric };
}

/**
 * Convenience string formatter when parts aren't needed.
 */
export function formatCurrency(value: unknown, options: FormatOptions = {}) {
  const { symbol, numeric } = formatCurrencyParts(value, options);
  return `${symbol}${numeric}`;
}

export const currencyConfig = {
  locale: DEFAULT_LOCALE,
  currency: DEFAULT_CURRENCY,
  symbol: EXPECTED_SYMBOL,
};
