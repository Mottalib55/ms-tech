export interface Account {
  id: string; name: string; institution: string; type: string; balance: number; currency: string;
  lastSync: string | null; status: string; color: string; connectionId: string | null;
  positionCount: number; provider: string | null; manual: boolean; syncError: string | null;
}
export interface Holding {
  id: string; accountId: string; symbol: string; name: string; quantity: number; avgPrice: number; currentPrice: number;
  currency: string; assetClass: string; sector: string; region: string; dailyChange: number;
  externalId?: string | null; account?: { name: string; connectionId: string | null };
}
export interface Transaction {
  id: string; accountId: string; type: string; symbol: string | null; name: string | null; amount: number;
  currency: string; date: string; description: string | null;
}
export interface AccountDetail extends Omit<Account, 'positionCount' | 'provider' | 'syncError'> {
  holdings: Holding[]; transactions: Transaction[];
  connection: { id: string; provider: string; status: string; lastSyncError: string | null } | null;
}
export interface Fee {
  id: string; accountId: string; accountName: string; type: string; label: string; amount: number; percentage: number;
  frequency: string; suggestion: string | null; alternativeFee: number | null; isManual: boolean;
}
export interface Dividend {
  id: string; holdingId: string; symbol: string; name: string; amount: number; currency: string;
  exDate: string; payDate: string; status: string; frequency: string; isManual: boolean;
}
export interface BudgetCategory { id?: string; name: string; icon: string; color: string; budgeted: number; spent: number }
export interface MonthlyBudget { id: string; month: string; income: number; expenses: number; savings: number; categories: BudgetCategory[] }
export interface PerformancePoint { date: string; value: number }
export interface AllocationSlice { key: string; name: string; color: string; value: number; percent: number }
export interface Summary {
  currency: string; netWorth: number; assets: number; debts: number; allocation: AllocationSlice[];
  accountCount: number; connectedCount: number; errorCount: number; positionCount: number; passiveIncome: number;
  diversification: number; change30d: number | null; lastSync: string | null;
}
export interface Connection {
  id: string; provider: string; status: string; lastSyncAt: string | null; lastSyncStatus: string | null;
  lastSyncError: string | null; createdAt: string; _count: { financialAccounts: number };
}
export interface Provider { slug: string; name: string; region: string; configured: boolean; kind: 'api_key' | 'redirect' }
export interface Alert { id: string; level: 'error' | 'warning' | 'info'; title: string; detail: string; href: string }
export interface Me { id: string; name: string | null; email: string; currency: string; language: string; isDemo: boolean; createdAt: string }
export interface MonteCarloParams {
  currentAge: number; retirementAge: number; currentCapital: number; monthlyContribution: number;
  expectedReturn: number; volatility: number; inflation: number; targetAmount: number;
}
export interface MonteCarloResult { age: number; pessimistic: number; p10: number; median: number; p90: number; optimistic: number }
export interface SimulatorResult { year: number; capital: number; contributions: number; interest: number }
export interface LoanResult {
  monthlyPayment: number; totalCost: number; totalInterest: number;
  amortization: { month: number; principal: number; interest: number; remaining: number }[];
}
