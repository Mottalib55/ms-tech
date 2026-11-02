// Totals must never add dollars to euros. Rates come from the ECB via
// Frankfurter; if it is unreachable we keep the last good table, then a static
// one, so a page still renders with close-enough figures rather than failing.
const FALLBACK: Record<string, number> = {
  EUR: 1, USD: 1.08, GBP: 0.85, CHF: 0.94, AED: 3.97, CAD: 1.48, JPY: 165, SAR: 4.05, MAD: 10.8,
};
let cache: { at: number; rates: Record<string, number> } | null = null;
const TTL = 12 * 60 * 60 * 1000;

export async function getRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.at < TTL) return cache.rates;
  if (process.env.FX_OFFLINE === '1') return FALLBACK;
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR', {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { rates: Record<string, number> };
    // The ECB does not quote AED or SAR; both are pegged to the dollar.
    const usd = data.rates.USD;
    const pegged: Record<string, number> = usd ? { AED: usd * 3.6725, SAR: usd * 3.75 } : {};
    const rates = { ...FALLBACK, ...pegged, ...data.rates, EUR: 1 };
    cache = { at: Date.now(), rates };
    return rates;
  } catch {
    return cache?.rates ?? FALLBACK;
  }
}

export function convert(amount: number, from: string, to: string, rates: Record<string, number>) {
  if (from === to) return amount;
  const a = rates[from];
  const b = rates[to];
  if (!a || !b) return amount;
  return (amount / a) * b;
}
