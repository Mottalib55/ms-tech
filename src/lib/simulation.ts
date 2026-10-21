import { MonteCarloParams, MonteCarloResult, SimulatorResult, LoanResult } from '@/types';

export function runMonteCarlo(params: MonteCarloParams, numSimulations = 5000): MonteCarloResult[] {
  const years = params.retirementAge - params.currentAge;
  const results: number[][] = [];

  for (let i = 0; i <= years; i++) {
    results.push([]);
  }

  for (let sim = 0; sim < numSimulations; sim++) {
    let capital = params.currentCapital;
    for (let year = 0; year <= years; year++) {
      results[year].push(capital);
      const annualReturn = randomNormal(params.expectedReturn / 100, params.volatility / 100);
      const realReturn = annualReturn - params.inflation / 100;
      capital = capital * (1 + realReturn) + params.monthlyContribution * 12;
    }
  }

  return results.map((yearData, i) => {
    yearData.sort((a, b) => a - b);
    const len = yearData.length;
    return {
      age: params.currentAge + i,
      pessimistic: yearData[Math.floor(len * 0.05)],
      p10: yearData[Math.floor(len * 0.1)],
      median: yearData[Math.floor(len * 0.5)],
      p90: yearData[Math.floor(len * 0.9)],
      optimistic: yearData[Math.floor(len * 0.95)],
    };
  });
}

function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

export function simulateCompoundInterest(
  initialCapital: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): SimulatorResult[] {
  const results: SimulatorResult[] = [];
  let capital = initialCapital;
  let totalContributions = initialCapital;

  for (let year = 0; year <= years; year++) {
    const interest = capital - totalContributions;
    results.push({
      year,
      capital: Math.round(capital),
      contributions: Math.round(totalContributions),
      interest: Math.round(interest < 0 ? 0 : interest),
    });
    const monthlyRate = annualRate / 100 / 12;
    for (let month = 0; month < 12; month++) {
      capital = capital * (1 + monthlyRate) + monthlyContribution;
      totalContributions += monthlyContribution;
    }
  }

  return results;
}

export function simulateLoan(
  amount: number,
  annualRate: number,
  years: number
): LoanResult {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;
  const monthlyPayment =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const amortization: LoanResult['amortization'] = [];
  let remaining = amount;

  for (let month = 1; month <= totalMonths; month++) {
    const interest = remaining * monthlyRate;
    const principal = monthlyPayment - interest;
    remaining -= principal;
    if (month % 12 === 0 || month === 1 || month === totalMonths) {
      amortization.push({
        month,
        principal: Math.round(principal),
        interest: Math.round(interest),
        remaining: Math.max(0, Math.round(remaining)),
      });
    }
  }

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalCost: Math.round(monthlyPayment * totalMonths * 100) / 100,
    totalInterest: Math.round((monthlyPayment * totalMonths - amount) * 100) / 100,
    amortization,
  };
}
