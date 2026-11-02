// Pure calculations, shared by the server and the unit tests.
export const ASSET_CLASSES: Record<string, { name: string; color: string }> = {
  stocks: { name: 'Actions', color: 'var(--c1)' },
  etf: { name: 'ETF', color: 'var(--c2)' },
  crypto: { name: 'Crypto', color: 'var(--c5)' },
  'real-estate': { name: 'Immobilier', color: 'var(--c3)' },
  bonds: { name: 'Obligations', color: 'var(--c4)' },
  cash: { name: 'Liquidités', color: 'var(--c6)' },
  commodities: { name: 'Matières premières', color: 'var(--c7)' },
  insurance: { name: 'Assurance-vie', color: 'var(--c8)' },
  other: { name: 'Autres', color: 'var(--c9)' },
};

export const ACCOUNT_TYPES: Record<string, { name: string; assetClass: string; debt?: boolean }> = {
  bank: { name: 'Banque / épargne', assetClass: 'cash' },
  brokerage: { name: 'Bourse (PEA, CTO)', assetClass: 'cash' },
  insurance: { name: 'Assurance-vie', assetClass: 'insurance' },
  crypto: { name: 'Crypto', assetClass: 'crypto' },
  'real-estate': { name: 'Immobilier', assetClass: 'real-estate' },
  other: { name: 'Autre actif', assetClass: 'other' },
  loan: { name: 'Crédit / dette', assetClass: 'other', debt: true },
};

export interface AllocationSlice { key: string; name: string; color: string; value: number; percent: number }

export function toAllocation(totals: Record<string, number>): AllocationSlice[] {
  const positive = Object.entries(totals).filter(([, v]) => v > 0.005);
  const sum = positive.reduce((s, [, v]) => s + v, 0);
  return positive
    .map(([key, value]) => ({
      key,
      name: ASSET_CLASSES[key]?.name ?? key,
      color: ASSET_CLASSES[key]?.color ?? 'var(--c9)',
      value: Math.round(value * 100) / 100,
      percent: sum > 0 ? Math.round((value / sum) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * 0–100 from the Herfindahl index of the asset-class weights: one class scores
 * 0, an even split across six classes or more scores 100.
 */
export function diversificationScore(slices: { value: number }[]): number {
  const sum = slices.reduce((s, x) => s + x.value, 0);
  if (sum <= 0 || slices.length < 2) return 0;
  const hhi = slices.reduce((s, x) => s + (x.value / sum) ** 2, 0);
  const floor = 1 / 6;
  return Math.round(Math.min(1, (1 - hhi) / (1 - floor)) * 100);
}

export function percentChange(from: number | undefined, to: number): number | null {
  if (from === undefined || from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

const PERIODS: Record<string, number> = { '1M': 30, '3M': 91, '6M': 182, '1A': 365, '5A': 1826 };
export const PERIOD_KEYS = Object.keys(PERIODS);

export function filterPeriod<T extends { date: string }>(points: T[], period: string, now = new Date()): T[] {
  const days = PERIODS[period];
  if (!days) return points;
  const start = new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  return points.filter((p) => p.date >= start);
}

const ANNUAL: Record<string, number> = { monthly: 12, quarterly: 4, 'semi-annual': 2, annual: 1 };
export function annualizedFee(amount: number, frequency: string) {
  return amount * (ANNUAL[frequency] ?? 1);
}

/** Savings a cheaper rate would give; 0 when no alternative or no current rate. */
export function feeSavings(annualAmount: number, percentage: number, alternative?: number | null) {
  if (alternative === undefined || alternative === null || percentage <= 0) return 0;
  return Math.max(0, annualAmount * (1 - alternative / percentage));
}
