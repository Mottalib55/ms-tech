import { parseAmount, toInputNumber } from '@/lib/utils';

/** A simulator input as a usable number: empty, negative or garbage never reaches a formula. */
export function toNumber(text: string, max = 1e12): number {
  const n = parseAmount(text);
  return Number.isNaN(n) ? 0 : Math.min(max, Math.max(0, n));
}

export const toField = toInputNumber;
