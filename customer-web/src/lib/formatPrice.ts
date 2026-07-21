/**
 * Format a price value with PKR prefix and locale-aware commas.
 * Handles string, number, null, and undefined inputs.
 * Per AGENTS.md: if price is missing/undefined, display 'unset'.
 */
export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'unset';

  // Parse number from string (remove existing commas)
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

  if (isNaN(num)) return 'unset';

  // Format with locale commas
  return `PKR ${num.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Format a compact price (no decimal places).
 */
export function formatPriceCompact(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'unset';

  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

  if (isNaN(num)) return 'unset';

  return `PKR ${Math.round(num).toLocaleString('en-PK')}`;
}
