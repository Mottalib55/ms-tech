import { MonteCarloParams, MonteCarloResult, SimulatorResult, LoanResult } from '@/types';

const MAX_YEARS = 80;
const clampYears = (n: number) => Math.max(0, Math.min(MAX_YEARS, Math.floor(Number.isFinite(n) ? n : 0)));
const safe = (n: number) => (Number.isFinite(n) ? n : 0);

function randomNormal(mean: number, stdDev: number, rand: () => number): number {
  const u1 = Math.max(rand(), 1e-12);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand());
  return mean + stdDev * z;
}

/** Figures are in today's money (returns net of inflation). Invalid ages give an empty series, not a crash. */
export function runMonteCarlo(params: MonteCarloParams, numSimulations = 2000, rand: () => number = Math.random): MonteCarloResult[] {
  const years = clampYears(params.retirementAge - params.currentAge);
  if (params.retirementAge <= params.currentAge) return [];
  const results = Array.from({ length: years + 1 }, () => new Float64Array(numSimulations));
  const mean = safe(params.expectedReturn) / 100;
  const vol = safe(params.volatility) / 100;
  const inflation = safe(params.inflation) / 100;
  const yearly = safe(params.monthlyContribution) * 12;
  for (let sim = 0; sim < numSimulations; sim++) {
    let capital = safe(params.currentCapital);
    for (let year = 0; year <= years; year++) {
      results[year][sim] = capital;
      // A year cannot lose more than everything: capital stays at or above zero.
      capital = Math.max(0, capital * (1 + randomNormal(mean, vol, rand) - inflation) + yearly);
    }
  }
  return results.map((row, i) => {
    row.sort();
    const at = (q: number) => row[Math.min(row.length - 1, Math.floor(row.length * q))];
    return { age: params.currentAge + i, pessimistic: at(0.05), p10: at(0.1), median: at(0.5), p90: at(0.9), optimistic: at(0.95) };
  });
}

export function simulateCompoundInterest(initialCapital: number, monthlyContribution: number, annualRate: number, years: number): SimulatorResult[] {
  const results: SimulatorResult[] = [];
  const horizon = clampYears(years);
  const monthlyRate = safe(annualRate) / 100 / 12;
  const monthly = safe(monthlyContribution);
  let capital = safe(initialCapital);
  let paid = capital;
  for (let year = 0; year <= horizon; year++) {
    results.push({ year, capital: Math.round(capital), contributions: Math.round(paid), interest: Math.round(Math.max(0, capital - paid)) });
    for (let m = 0; m < 12; m++) {
      capital = capital * (1 + monthlyRate) + monthly;
      paid += monthly;
    }
  }
  return results;
}

/** Handles the 0 % loan, where the textbook formula divides by zero. */
export function simulateLoan(amount: number, annualRate: number, years: number): LoanResult {
  const principal0 = Math.max(0, safe(amount));
  const totalMonths = clampYears(years) * 12;
  if (totalMonths === 0 || principal0 === 0) return { monthlyPayment: 0, totalCost: 0, totalInterest: 0, amortization: [] };
  const r = Math.max(0, safe(annualRate)) / 100 / 12;
  const monthlyPayment = r === 0 ? principal0 / totalMonths : (principal0 * r) / (1 - Math.pow(1 + r, -totalMonths));
  const amortization: LoanResult['amortization'] = [];
  let remaining = principal0;
  let yearP = 0;
  let yearI = 0;
  for (let month = 1; month <= totalMonths; month++) {
    const interest = remaining * r;
    const principal = monthlyPayment - interest;
    remaining -= principal;
    yearP += principal;
    yearI += interest;
    if (month % 12 === 0) {
      amortization.push({ month, principal: Math.round(yearP), interest: Math.round(yearI), remaining: Math.max(0, Math.round(remaining)) });
      yearP = 0;
      yearI = 0;
    }
  }
  const totalCost = monthlyPayment * totalMonths;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return { monthlyPayment: r2(monthlyPayment), totalCost: r2(totalCost), totalInterest: r2(totalCost - principal0), amortization };
}
