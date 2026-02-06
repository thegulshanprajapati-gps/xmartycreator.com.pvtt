'use client';

import { ensureNumber, formatCurrencyParts } from '@/lib/currency';

type MoneySize = 'sm' | 'md' | 'lg';

interface MoneyProps {
  value: number | string;
  size?: MoneySize;
  className?: string;
  symbolClassName?: string;
  valueClassName?: string;
}

interface PriceProps {
  value: number | string;
  originalValue?: number | string;
  discount?: number | string;
  showDiscount?: boolean;
  size?: MoneySize;
}

const sizeClasses: Record<MoneySize, string> = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-4xl',
};

/**
 * Single source of truth for rendering money.
 * No gradients, no masking—just solid text with shared formatting.
 */
export function Money({
  value,
  size = 'md',
  className = '',
  symbolClassName = '',
  valueClassName = '',
}: MoneyProps) {
  const { symbol, numeric } = formatCurrencyParts(value);

  return (
    <span className={`inline-flex items-baseline gap-1 ${sizeClasses[size]} ${className}`}>
      <span
        className={`font-bold text-foreground ${symbolClassName}`}
        style={{
          fontFamily:
            "'Noto Sans Devanagari','Noto Sans','Segoe UI Symbol','Arial Unicode MS',system-ui,sans-serif",
        }}
      >
        {symbol}
      </span>
      <span
        className={`font-bold text-foreground ${valueClassName}`}
        style={{
          fontFamily:
            "'Noto Sans','Noto Sans Devanagari','Segoe UI','Inter',system-ui,sans-serif",
        }}
      >
        {numeric}
      </span>
    </span>
  );
}

/**
 * Price block with optional original/discount, used on cards and detail pages.
 */

export function Price({
  value,
  originalValue,
  discount,
  showDiscount = true,
  size = 'md',
}: PriceProps) {
  const amount = ensureNumber(value, 'Price.value');
  const original = originalValue !== undefined ? ensureNumber(originalValue, 'Price.originalValue') : undefined;
  const discountNumber = discount !== undefined ? ensureNumber(discount, 'Price.discount') : undefined;
  const hasDiscount = original !== undefined && original > amount;

  // Guard: if numeric formatted string already has a symbol, strip before passing to Money
  const cleanAmount = ensureNumber(amount, 'Price.cleanAmount');
  const cleanOriginal = original !== undefined ? ensureNumber(original, 'Price.cleanOriginal') : undefined;

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <Money value={cleanAmount} size={size} />

      {hasDiscount && (
        <>
          <Money
            value={cleanOriginal ?? 0}
            size="sm"
            className="text-muted-foreground line-through"
            symbolClassName="text-muted-foreground"
            valueClassName="text-muted-foreground"
          />

          {showDiscount && discountNumber && discountNumber > 0 && (
            <span className="bg-destructive text-white px-2 py-0.5 rounded text-xs font-bold tracking-tight">
              {discountNumber}% OFF
            </span>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Larger preset for hero/CTA price usage.
 */
export function LargePrice(props: PriceProps) {
  return <Price {...props} size="lg" />;
}
