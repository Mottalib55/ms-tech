import { BaseConnector } from '../base';
import { registerConnector } from '../registry';
import type {
  ProviderSlug,
  ConnectionInitResult,
  CallbackResult,
  SyncResult,
  NormalizedAccount,
  NormalizedTransaction,
} from '../types';

interface LeanEntity {
  entity_id: string;
  name: string;
}

interface LeanAccount {
  account_id: string;
  name: string;
  balance: number;
  currency: string;
  type: string;
  institution: { name: string };
}

interface LeanTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  type: string;
}

const LEAN_BASE_URL = process.env.LEAN_BASE_URL || 'https://sandbox.leantech.me';
const LEAN_APP_TOKEN = process.env.LEAN_APP_TOKEN || '';

class LeanConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'lean';
  readonly displayName = 'Lean Technologies';
  readonly region = 'UAE / MENA';

  async initiateConnection(_userId: string, callbackUrl: string): Promise<ConnectionInitResult> {
    return {
      type: 'widget',
      widgetUrl: `${LEAN_BASE_URL}/connect?app_token=${LEAN_APP_TOKEN}&redirect_url=${encodeURIComponent(callbackUrl)}`,
    };
  }

  async handleCallback(params: Record<string, string>): Promise<CallbackResult> {
    const { entity_id, permissions_id } = params;
    if (!entity_id) throw new Error('Missing entity_id from Lean callback');

    return {
      externalId: entity_id,
      accessToken: permissions_id || entity_id,
    };
  }

  async sync(accessToken: string): Promise<SyncResult> {
    const headers = {
      Authorization: `Bearer ${LEAN_APP_TOKEN}`,
      'lean-app-token': LEAN_APP_TOKEN,
    };

    const accountsRes = await this.fetchJson<{ data: LeanAccount[] }>(
      `${LEAN_BASE_URL}/v1/accounts?entity_id=${accessToken}`,
      { headers }
    ).catch(() => ({ data: [] as LeanAccount[] }));

    const transactionsRes = await this.fetchJson<{ data: LeanTransaction[] }>(
      `${LEAN_BASE_URL}/v1/transactions?entity_id=${accessToken}`,
      { headers }
    ).catch(() => ({ data: [] as LeanTransaction[] }));

    const accounts: NormalizedAccount[] = (accountsRes.data || []).map((a) => ({
      externalId: a.account_id,
      name: a.name || 'Lean Account',
      institution: a.institution?.name || 'Lean',
      type: a.type === 'savings' ? 'bank' : 'bank',
      balance: a.balance,
      currency: a.currency || 'AED',
      color: '#5682f2',
    }));

    const transactions: NormalizedTransaction[] = (transactionsRes.data || []).map((tx) => ({
      externalId: tx.transaction_id,
      accountExternalId: tx.account_id,
      type: tx.amount >= 0 ? 'deposit' : 'withdrawal',
      name: tx.description,
      amount: tx.amount,
      currency: tx.currency || 'AED',
      date: new Date(tx.date),
      description: tx.description,
    }));

    return { accounts, holdings: [], fees: [], dividends: [], transactions };
  }

  async refreshCredentials(_refreshToken: string): Promise<{ accessToken: string }> {
    // Lean uses entity_id which doesn't expire
    return { accessToken: _refreshToken };
  }

  verifyWebhook(body: string, signature: string): boolean {
    // Lean webhooks use a simple token comparison
    const expected = process.env.LEAN_WEBHOOK_SECRET || '';
    return expected ? signature === expected : false;
  }
}

const lean = new LeanConnector();
registerConnector('lean', () => lean);
export default lean;
