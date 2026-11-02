import type { NormalizedAccount, NormalizedHolding, NormalizedTransaction, SyncResult } from '../types';
import type { PowensRawData } from './client';

// https://docs.powens.com/api-reference/products/data-aggregation/bank-account-types
const ACCOUNT_TYPE_MAP: Record<string, string> = {
  checking: 'bank', savings: 'bank', deposit: 'bank', card: 'bank', joint: 'bank', cat: 'bank', cel: 'bank',
  csl: 'bank', ldds: 'bank', livret_a: 'bank', livret_b: 'bank', pel: 'bank',
  market: 'brokerage', pea: 'brokerage', pee: 'brokerage', rsp: 'brokerage', perco: 'brokerage',
  lifeinsurance: 'insurance', capitalisation: 'insurance', per: 'insurance', perp: 'insurance',
  madelin: 'insurance', article83: 'insurance',
  real_estate: 'real-estate',
  crowdlending: 'other',
  loan: 'loan', consumercredit: 'loan', revolvingcredit: 'loan',
};

const ACCOUNT_COLOR_MAP: Record<string, string> = {
  bank: '#5682f2', brokerage: '#f4be7e', insurance: '#a78bfa', 'real-estate': '#34d399', loan: '#f87171', other: '#94a3b8',
};

function mapTransactionType(type: string | null | undefined, value: number): string {
  switch (type) {
    case 'transfer': return 'transfer';
    case 'bank': return 'fee';
    case 'withdrawal':
    case 'loan_payment': return 'withdrawal';
    case 'deposit':
    case 'payback': return 'deposit';
    case 'order': return value < 0 ? 'buy' : 'sell';
    // Anything else (card, check, unknown...) is an ordinary movement: its sign says which way.
    default: return value >= 0 ? 'deposit' : 'withdrawal';
  }
}

/**
 * The Investment object has no asset-type field. `details.asset_category` is the
 * only hint and is nullable; `code_type` is the code's scheme (ISIN / AMF), which
 * says nothing about the asset: an FR ISIN can be a fund as well as a share.
 * VERIFY: the exact values of details.asset_category on a real account; matched loosely here.
 */
export function guessAssetClass(label: string, category?: string | null, codeType?: string | null): string {
  const text = `${category ?? ''} ${label}`.toLowerCase();
  if (/\b(etf|ucits|tracker)\b/.test(text)) return 'etf';
  if (/obligation|bond|fonds? (en )?euros?/.test(text)) return 'bonds';
  if (/immobili|real.?estate|\bscpi\b|\bopci\b/.test(text)) return 'real-estate';
  if (/liquidit|monétaire|cash/.test(text)) return 'cash';
  if (/equit|action/.test(text)) return 'stocks';
  // AMF codes identify French funds, not shares.
  if (codeType === 'AMF' || /\b(fcp|sicav|fonds|fund)\b/.test(text)) return 'other';
  return codeType === 'ISIN' ? 'stocks' : 'other';
}

export function normalizePowensData(raw: PowensRawData): SyncResult {
  const currencyOf = new Map<number, string>();
  const accounts: NormalizedAccount[] = raw.accounts.map((a) => {
    const type = ACCOUNT_TYPE_MAP[a.type ?? ''] ?? 'bank';
    const currency = a.currency?.id || 'EUR';
    currencyOf.set(a.id, currency);
    return {
      externalId: String(a.id),
      name: a.name || a.original_name || `Compte ${a.id}`,
      institution: a.company_name || 'Banque',
      type,
      // Debts are held positive everywhere in the app, whatever sign the bank uses.
      balance: type === 'loan' ? Math.abs(a.balance ?? a.loan?.total_amount ?? 0) : a.balance ?? 0,
      currency,
      color: ACCOUNT_COLOR_MAP[type],
    };
  });
  const known = new Set(accounts.map((a) => a.externalId));

  const holdings: NormalizedHolding[] = raw.investments
    .filter((inv) => known.has(String(inv.id_account)))
    .map((inv) => ({
      externalId: String(inv.id),
      accountExternalId: String(inv.id_account),
      symbol: inv.stock_symbol || inv.code || inv.label.slice(0, 6).toUpperCase(),
      name: inv.label,
      quantity: inv.quantity ?? 0,
      avgPrice: inv.unitprice ?? inv.unitvalue ?? 0,
      currentPrice: inv.unitvalue ?? 0,
      // unitvalue is in the account's currency; original_* hold the foreign one.
      currency: currencyOf.get(inv.id_account) ?? 'EUR',
      assetClass: guessAssetClass(inv.label, inv.details?.asset_category, inv.code_type),
      sector: 'Autre',
      region: 'Monde',
      // VERIFY: prev_diff_percent is "since the previous sync" and may be a ratio (0.01 = 1 %); confirm on real data.
      dailyChange: inv.prev_diff_percent ?? 0,
    }));

  const transactions: NormalizedTransaction[] = raw.transactions
    .filter((tx) => known.has(String(tx.id_account)))
    .map((tx) => ({
      externalId: String(tx.id),
      accountExternalId: String(tx.id_account),
      type: mapTransactionType(tx.type, tx.value),
      name: tx.simplified_wording || tx.original_wording || undefined,
      amount: tx.value,
      currency: currencyOf.get(tx.id_account) ?? 'EUR',
      date: new Date(tx.rdate || tx.date),
      description: tx.original_wording || undefined,
    }));

  return { accounts, holdings, fees: [], dividends: [], transactions };
}
