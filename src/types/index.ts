export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string;
  language: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: 'brokerage' | 'bank' | 'crypto' | 'real-estate' | 'insurance';
  balance: number;
  currency: string;
  lastSync: string;
  status: 'connected' | 'error' | 'pending';
  color: string;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  currency: string;
  assetClass: AssetClass;
  sector: string;
  region: string;
  accountId: string;
  dailyChange: number;
}

export type AssetClass = 'stocks' | 'bonds' | 'real-estate' | 'crypto' | 'cash' | 'etf' | 'commodities';

export interface Fee {
  id: string;
  accountId: string;
  accountName: string;
  type: 'management' | 'transaction' | 'custody' | 'exchange' | 'performance';
  label: string;
  amount: number;
  percentage: number;
  frequency: 'annual' | 'per-transaction' | 'monthly' | 'quarterly';
  suggestion?: string;
  alternativeFee?: number;
}

export interface Dividend {
  id: string;
  holdingId: string;
  symbol: string;
  name: string;
  amount: number;
  currency: string;
  exDate: string;
  payDate: string;
  status: 'paid' | 'confirmed' | 'projected';
  frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgeted: number;
  spent: number;
}

export interface MonthlyBudget {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  categories: BudgetCategory[];
}

export interface PerformancePoint {
  date: string;
  value: number;
}

export interface AllocationItem {
  name: string;
  value: number;
  color: string;
}

export interface MonteCarloParams {
  currentAge: number;
  retirementAge: number;
  currentCapital: number;
  monthlyContribution: number;
  expectedReturn: number;
  volatility: number;
  inflation: number;
  targetAmount: number;
}

export interface MonteCarloResult {
  age: number;
  pessimistic: number;
  median: number;
  optimistic: number;
  p10: number;
  p90: number;
}

export interface SimulatorResult {
  year: number;
  capital: number;
  contributions: number;
  interest: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
  amortization: { month: number; principal: number; interest: number; remaining: number }[];
}

export interface Transaction {
  id: string;
  accountId: string;
  externalId?: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'dividend' | 'fee' | 'transfer';
  symbol?: string;
  name?: string;
  quantity?: number;
  price?: number;
  amount: number;
  currency: string;
  date: string;
  description?: string;
}

export interface ProviderConnectionInfo {
  id: string;
  provider: string;
  status: 'pending' | 'active' | 'error' | 'disconnected';
  externalId?: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncError?: string;
  createdAt: string;
}

export interface SyncLogEntry {
  id: string;
  connectionId: string;
  status: 'started' | 'success' | 'error';
  durationMs?: number;
  recordCount?: number;
  error?: string;
  createdAt: string;
}
