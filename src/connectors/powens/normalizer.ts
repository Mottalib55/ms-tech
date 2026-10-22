import type { SyncResult, NormalizedAccount, NormalizedHolding, NormalizedTransaction } from '../types';
import type { PowensRawData } from './client';

const ACCOUNT_TYPE_MAP: Record<string, string> = {
  checking: 'bank',
  savings: 'bank',
  deposit: 'bank',
  loan: 'bank',
  market: 'brokerage',
  pea: 'brokerage',
  life_insurance: 'insurance',
  capitalisation: 'insurance',
  real_estate: 'real-estate',
  credit_card: 'bank',
};

const ACCOUNT_COLOR_MAP: Record<string, string> = {
  bank: '#5682f2',
  brokerage: '#f4be7e',
  insurance: '#a78bfa',
  'real-estate': '#34d399',
  crypto: '#f97316',
};

function mapTransactionType(type: string): string {
  switch (type) {
    case 'transfer': return 'transfer';
    case 'order': return 'buy';
    case 'withdrawal': return 'withdrawal';
    case 'deposit': return 'deposit';
    case 'payback': return 'deposit';
    case 'loan_payment': return 'withdrawal';
    default: return 'buy';
  }
}

function guessAssetClass(code: string, codeType: string): string {
  if (codeType === 'ISIN') {
    // Basic heuristics for ISIN-based instruments
    if (code.startsWith('FR') || code.startsWith('US') || code.startsWith('DE')) {
      return 'stocks';
    }
  }
  if (codeType === 'ETF' || code.toLowerCase().includes('etf')) return 'etf';
  if (codeType === 'CRYPTO') return 'crypto';
  return 'stocks';
}

export function normalizePowensData(raw: PowensRawData): SyncResult {
  const accounts: NormalizedAccount[] = raw.accounts.map((a) => ({
    externalId: String(a.id),
    name: a.name || `Compte ${a.id}`,
    institution: a.company_name || 'Powens',
    type: ACCOUNT_TYPE_MAP[a.type] || 'bank',
    balance: a.balance,
    currency: a.currency?.id || 'EUR',
    color: ACCOUNT_COLOR_MAP[ACCOUNT_TYPE_MAP[a.type] || 'bank'],
  }));

  const holdings: NormalizedHolding[] = raw.investments.map((inv) => ({
    externalId: String(inv.id),
    symbol: inv.code || inv.label.substring(0, 6).toUpperCase(),
    name: inv.label,
    quantity: inv.quantity,
    avgPrice: inv.unitprice,
    currentPrice: inv.unitvalue,
    currency: 'EUR',
    assetClass: guessAssetClass(inv.code, inv.code_type),
    sector: 'Other',
    region: inv.code?.startsWith('FR') ? 'France' : inv.code?.startsWith('US') ? 'USA' : 'Europe',
    dailyChange: inv.diff_percent || 0,
  }));

  const transactions: NormalizedTransaction[] = raw.transactions.map((tx) => ({
    externalId: String(tx.id),
    accountExternalId: String(tx.id_account),
    type: mapTransactionType(tx.type),
    name: tx.simplified_wording || tx.original_wording,
    amount: tx.value,
    currency: 'EUR',
    date: new Date(tx.rdate || tx.date),
    description: tx.original_wording,
  }));

  return {
    accounts,
    holdings,
    fees: [],
    dividends: [],
    transactions,
  };
}
