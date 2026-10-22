import { createHmac } from 'crypto';
import { BaseConnector } from '../base';
import { registerConnector } from '../registry';
import type {
  ProviderSlug,
  ConnectionInitResult,
  CallbackResult,
  SyncResult,
  NormalizedAccount,
  NormalizedHolding,
  NormalizedTransaction,
} from '../types';

interface SaltEdgeAccount {
  id: string;
  name: string;
  nature: string;
  balance: number;
  currency_code: string;
  extra?: { cards?: string[] };
  connection_id: string;
}

interface SaltEdgeTransaction {
  id: string;
  account_id: string;
  amount: number;
  currency_code: string;
  made_on: string;
  description: string;
  category: string;
  mode: string;
}

const SALTEDGE_APP_ID = process.env.SALTEDGE_APP_ID || '';
const SALTEDGE_SECRET = process.env.SALTEDGE_SECRET || '';
const SALTEDGE_BASE_URL = 'https://www.saltedge.com/api/v5';

class SaltEdgeConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'saltedge';
  readonly displayName = 'Salt Edge';
  readonly region = 'Global';

  private get authHeaders() {
    return {
      'App-id': SALTEDGE_APP_ID,
      Secret: SALTEDGE_SECRET,
    };
  }

  async initiateConnection(_userId: string, callbackUrl: string): Promise<ConnectionInitResult> {
    const data = await this.fetchJson<{ data: { connect_url: string; id: string } }>(
      `${SALTEDGE_BASE_URL}/connect_sessions/create`,
      {
        method: 'POST',
        headers: this.authHeaders,
        body: JSON.stringify({
          data: {
            customer_id: _userId,
            consent: {
              scopes: ['account_details', 'transactions_details'],
              from_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            },
            attempt: { return_to: callbackUrl },
          },
        }),
      }
    );

    return {
      type: 'redirect',
      redirectUrl: data.data.connect_url,
      connectionId: data.data.id,
    };
  }

  async handleCallback(params: Record<string, string>): Promise<CallbackResult> {
    const { connection_id } = params;
    if (!connection_id) throw new Error('Missing connection_id from Salt Edge callback');

    return {
      externalId: connection_id,
      accessToken: connection_id,
    };
  }

  async sync(accessToken: string): Promise<SyncResult> {
    const accountsRes = await this.fetchJson<{ data: SaltEdgeAccount[] }>(
      `${SALTEDGE_BASE_URL}/accounts?connection_id=${accessToken}`,
      { headers: this.authHeaders }
    ).catch(() => ({ data: [] as SaltEdgeAccount[] }));

    const transactionsRes = await this.fetchJson<{ data: SaltEdgeTransaction[] }>(
      `${SALTEDGE_BASE_URL}/transactions?connection_id=${accessToken}`,
      { headers: this.authHeaders }
    ).catch(() => ({ data: [] as SaltEdgeTransaction[] }));

    const NATURE_MAP: Record<string, string> = {
      account: 'bank', savings: 'bank', card: 'bank',
      debit_card: 'bank', credit_card: 'bank',
      bonus: 'bank', insurance: 'insurance',
      investment: 'brokerage', mortgage: 'bank',
    };

    const accounts: NormalizedAccount[] = (accountsRes.data || []).map((a) => ({
      externalId: a.id,
      name: a.name,
      institution: 'Salt Edge',
      type: NATURE_MAP[a.nature] || 'bank',
      balance: a.balance,
      currency: a.currency_code,
      color: '#a78bfa',
    }));

    const transactions: NormalizedTransaction[] = (transactionsRes.data || []).map((tx) => ({
      externalId: tx.id,
      accountExternalId: tx.account_id,
      type: tx.amount >= 0 ? 'deposit' : 'withdrawal',
      name: tx.description,
      amount: tx.amount,
      currency: tx.currency_code,
      date: new Date(tx.made_on),
      description: `${tx.category}: ${tx.description}`,
    }));

    return { accounts, holdings: [], fees: [], dividends: [], transactions };
  }

  async refreshCredentials(refreshToken: string): Promise<{ accessToken: string }> {
    return { accessToken: refreshToken };
  }

  verifyWebhook(body: string, signature: string): boolean {
    const secret = process.env.SALTEDGE_WEBHOOK_SECRET || '';
    if (!secret) return false;
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    return expected === signature;
  }
}

const saltedge = new SaltEdgeConnector();
registerConnector('saltedge', () => saltedge);
export default saltedge;
