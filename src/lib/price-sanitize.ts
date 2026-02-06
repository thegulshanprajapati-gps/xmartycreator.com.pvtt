/**
 * Sanitize any incoming price-like string/value.
 * - Strips currency symbols/letters/spaces
 * - Parses to number
 * - Returns formatted en-IN string (no symbol)
 */
export function sanitizePriceString(value: unknown): string {
  if (value === null || value === undefined) return '';
  const normalized = String(value).replace(/[^\d.-]/g, '');
  if (!normalized) return '';
  const num = Number(normalized);
  if (!Number.isFinite(num)) return '';
  return num.toLocaleString('en-IN');
}

/**
 * Replace any currency-like patterns in HTML with sanitized INR format prefixed with ₹.
 * This is intentionally conservative to avoid altering non-price numbers.
 */
export function scrubCurrencyInHtml(html: string): string {
  // 1) Normalize any known currency symbols to ₹
  const normalized = html.replace(/[₱$€£¥₩]/g, '₹');

  // 2) Replace any ₹ followed by a number (even if punctuation before it, e.g. "*₹1,000*")
  return normalized.replace(/₹\s?[A-Za-z]?\s?([\d.,]+(?:\.\d+)?)/g, (_match, num) => {
    const clean = sanitizePriceString(num);
    return clean ? `₹${clean}` : num;
  });
}
