// Shared display formats. A missing or zero value shows an em dash, never a zero.
export const DASH = '—';

export function formatPeso(value, { compact = false } = {}) {
  const amount = Number(value);
  if (!value || !Number.isFinite(amount) || amount === 0) return DASH;
  if (compact && Math.abs(amount) >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  return `₱${amount.toLocaleString()}`;
}

export function formatPercent(part, whole) {
  if (!whole) return DASH;
  return `${Math.round((part / whole) * 100)}%`;
}
