import { describe, expect, it } from 'vitest';
import { annualizedFee, diversificationScore, feeSavings, filterPeriod, percentChange, toAllocation } from '@/lib/finance';
import { runMonteCarlo, simulateCompoundInterest, simulateLoan } from '@/lib/simulation';
import { convert } from '@/server/fx';
import { parseAmount } from '@/lib/utils';

describe('allocation', () => {
  it('donne de vrais pourcentages (le bug affichait 113500 %)', () => {
    const a = toAllocation({ stocks: 113500, etf: 54276, bonds: 0 });
    expect(a.map((x) => x.key)).toEqual(['stocks', 'etf']);
    expect(a[0].percent).toBeCloseTo(67.6, 1);
    expect(a.reduce((s, x) => s + x.percent, 0)).toBeCloseTo(100, 0);
  });
  it('reste vide sans actif', () => expect(toAllocation({})).toEqual([]));
});

describe('diversification', () => {
  it('0 pour une seule classe, 100 pour six classes égales', () => {
    expect(diversificationScore([{ value: 100 }])).toBe(0);
    expect(diversificationScore(Array(6).fill({ value: 10 }))).toBe(100);
    expect(diversificationScore([])).toBe(0);
  });
});

describe('devises', () => {
  const rates = { EUR: 1, USD: 1.08 };
  it('convertit dans les deux sens', () => {
    expect(convert(108, 'USD', 'EUR', rates)).toBeCloseTo(100);
    expect(convert(100, 'EUR', 'USD', rates)).toBeCloseTo(108);
  });
});

describe('périodes et variations', () => {
  const now = new Date('2026-11-02');
  const points = [{ date: '2021-01-01' }, { date: '2026-06-01' }, { date: '2026-10-20' }];
  it('filtre réellement', () => {
    expect(filterPeriod(points, '1M', now)).toHaveLength(1);
    expect(filterPeriod(points, '6M', now)).toHaveLength(2);
    expect(filterPeriod(points, '5A', now)).toHaveLength(2);
  });
  it('pas de division par zéro', () => {
    expect(percentChange(0, 10)).toBeNull();
    expect(percentChange(undefined, 10)).toBeNull();
    expect(percentChange(100, 110)).toBeCloseTo(10);
    expect(percentChange(-100, -50)).toBeCloseTo(50);
  });
});

describe('frais', () => {
  it('annualise et calcule l\'économie sans diviser par 0', () => {
    expect(annualizedFee(10, 'monthly')).toBe(120);
    expect(feeSavings(100, 0, 0)).toBe(0);
    expect(feeSavings(100, 1, 0.25)).toBe(75);
    expect(feeSavings(100, 1, null)).toBe(0);
    expect(feeSavings(100, 1, 2)).toBe(0);
  });
});

describe('simulateurs', () => {
  it('prêt : valeur connue et cas du taux 0', () => {
    const loan = simulateLoan(250000, 3.5, 20);
    expect(loan.monthlyPayment).toBeCloseTo(1449.88, 1);
    expect(loan.amortization.at(-1)!.remaining).toBe(0);
    expect(simulateLoan(1200, 0, 1).monthlyPayment).toBe(100);
    expect(simulateLoan(0, 3, 10).monthlyPayment).toBe(0);
    expect(simulateLoan(1000, 3, 0).totalCost).toBe(0);
  });
  it('intérêts composés : valeur connue et champs vides', () => {
    const end = simulateCompoundInterest(10000, 0, 12, 1).at(-1)!;
    expect(end.capital).toBe(11268);
    expect(simulateCompoundInterest(NaN, NaN, NaN, NaN)).toEqual([{ year: 0, capital: 0, contributions: 0, interest: 0 }]);
    expect(simulateCompoundInterest(1, 1, 1, 1e9).length).toBe(81);
  });
  it('Monte Carlo : ordre des percentiles, déterministe, âges invalides', () => {
    let seed = 42;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const r = runMonteCarlo({ currentAge: 30, retirementAge: 60, currentCapital: 10000, monthlyContribution: 500, expectedReturn: 7, volatility: 15, inflation: 2, targetAmount: 1e6 }, 1000, rand);
    expect(r).toHaveLength(31);
    const last = r.at(-1)!;
    expect(last.pessimistic).toBeLessThanOrEqual(last.p10);
    expect(last.p10).toBeLessThanOrEqual(last.median);
    expect(last.median).toBeLessThanOrEqual(last.p90);
    expect(last.p90).toBeLessThanOrEqual(last.optimistic);
    expect(last.pessimistic).toBeGreaterThanOrEqual(0);
    expect(runMonteCarlo({ currentAge: 60, retirementAge: 30, currentCapital: 1, monthlyContribution: 1, expectedReturn: 1, volatility: 1, inflation: 1, targetAmount: 1 })).toEqual([]);
  });
});

describe('saisie', () => {
  it('comprend le format français', () => {
    expect(parseAmount('1 234,50')).toBe(1234.5);
    expect(parseAmount('1 000')).toBe(1000);
    expect(parseAmount('')).toBeNaN();
    expect(parseAmount('abc')).toBeNaN();
  });
});
