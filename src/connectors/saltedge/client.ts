import { createSign } from 'node:crypto';
import { BaseConnector } from '../base';
import { seal, sealOk, withQuery } from '../signing';
import type {
  CallbackResult, ConnectionInitResult, NormalizedAccount, NormalizedTransaction, ProviderSlug, SyncCredentials, SyncResult,
} from '../types';

interface SaltEdgeAccount {
  id: string;
  name: string;
  nature: string;
  balance: number;
  currency_code: string;
  extra?: { provider_name?: string };
}

interface SaltEdgeTransaction {
  id: string;
  account_id: string;
  amount: number;
  currency_code: string;
  made_on: string;
  description: string;
  category?: string;
  mode?: string;
  status?: string;
}

const BASE_URL = 'https://www.saltedge.com/api/v6';

const NATURES: Record<string, string> = {
  account: 'bank', bonus: 'bank', card: 'bank', checking: 'bank', debit_card: 'bank', ewallet: 'bank', savings: 'bank',
  insurance: 'insurance', investment: 'brokerage',
  credit: 'loan', credit_card: 'loan', loan: 'loan', mortgage: 'loan',
};

/**
 * API v6 (v5 is being retired): https://docs.saltedge.com/v6/ and /v6/api_reference.
 * One customer per user (identifier = our user id), a hosted Connect widget, and
 * `return_connection_id` so the id comes back on the return URL.
 */
class SaltEdgeConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'saltedge';
  readonly displayName = 'Salt Edge (banques internationales)';
  readonly region = 'Monde';

  isConfigured() {
    return !!(process.env.SALTEDGE_APP_ID && process.env.SALTEDGE_SECRET);
  }

  /** Live clients must sign: base64(RSA-SHA256("expires|METHOD|url|body")) with their private key. */
  private headers(method: string, url: string, body = ''): Record<string, string> {
    const headers: Record<string, string> = {
      'App-id': process.env.SALTEDGE_APP_ID ?? '',
      Secret: process.env.SALTEDGE_SECRET ?? '',
    };
    const key = process.env.SALTEDGE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (key) {
      const expires = String(Math.floor(Date.now() / 1000) + 60);
      headers['Expires-at'] = expires;
      headers.Signature = createSign('RSA-SHA256').update(`${expires}|${method}|${url}|${body}`).sign(key, 'base64');
    }
    return headers;
  }

  private post<T>(path: string, data: unknown) {
    const url = `${BASE_URL}${path}`;
    const body = JSON.stringify({ data });
    return this.fetchJson<{ data: T }>(url, { method: 'POST', headers: this.headers('POST', url, body), body });
  }

  private get<T>(url: string) {
    return this.fetchJson<T>(url, { headers: this.headers('GET', url) });
  }

  /** Follows `meta.next_id` so a long history is not silently cut at the first page. */
  private async all<T>(path: string): Promise<T[]> {
    const rows: T[] = [];
    let fromId: string | null = null;
    for (let page = 0; page < 50; page++) {
      const sep = path.includes('?') ? '&' : '?';
      const res: { data: T[]; meta?: { next_id?: string | null } } = await this.get(
        `${BASE_URL}${path}${sep}per_page=1000${fromId ? `&from_id=${fromId}` : ''}`,
      );
      rows.push(...(res.data ?? []));
      fromId = res.meta?.next_id ?? null;
      if (!fromId) break;
    }
    return rows;
  }

  private async ensureCustomer(userId: string) {
    try {
      await this.post('/customers', { identifier: userId });
    } catch (error) {
      // 409 DuplicatedCustomer: this user already has one, which is what we want.
      if (!(error instanceof Error && error.message.includes('(409)'))) throw error;
    }
  }

  async initiateConnection(userId: string, callbackUrl: string, state: string): Promise<ConnectionInitResult> {
    await this.ensureCustomer(userId);
    const { data } = await this.post<{ connect_url: string }>('/connections/connect', {
      customer_identifier: userId,
      return_connection_id: true,
      consent: {
        // VERIFY: these are the PSD2 scope names; a Fetch-type client uses accounts + balance instead.
        scopes: ['accounts', 'transactions'],
        from_date: new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10),
      },
      attempt: {
        locale: 'fr',
        // The widget appends connection_id; state and the sealed owner come back with it.
        return_to: withQuery(callbackUrl, { state, owner: userId, sig: seal(`saltedge|${userId}`) }),
      },
    });
    return { type: 'redirect', redirectUrl: data.connect_url };
  }

  async handleCallback(params: Record<string, string>): Promise<CallbackResult> {
    const { connection_id: id, owner, sig } = params;
    if (!id) throw new Error('Salt Edge n\'a pas renvoyé de connexion.');
    if (!owner || !sealOk(`saltedge|${owner}`, sig)) throw new Error('Retour Salt Edge non authentifié.');
    // The id is on a URL the user could edit: the connection must belong to them.
    const { data } = await this.get<{ data: { customer_identifier?: string } }>(`${BASE_URL}/connections/${encodeURIComponent(id)}`);
    if (data.customer_identifier !== owner) throw new Error('Cette connexion appartient à un autre client.');
    return { externalId: id, accessToken: id };
  }

  async sync({ accessToken: connectionId }: SyncCredentials): Promise<SyncResult> {
    const id = encodeURIComponent(connectionId);
    const rawAccounts = await this.all<SaltEdgeAccount>(`/accounts?connection_id=${id}`);
    const rawTransactions = await this.all<SaltEdgeTransaction>(`/transactions?connection_id=${id}`);

    const accounts: NormalizedAccount[] = rawAccounts.map((a) => {
      const type = NATURES[a.nature] ?? 'bank';
      return {
        externalId: a.id,
        name: a.name,
        // VERIFY: extra.provider_name is not on the v6 Account sample; "Banque" is the fallback.
        institution: a.extra?.provider_name || 'Banque',
        type,
        balance: type === 'loan' ? Math.abs(a.balance) : a.balance,
        currency: a.currency_code,
        color: type === 'loan' ? '#f87171' : '#a78bfa',
      };
    });

    const transactions: NormalizedTransaction[] = rawTransactions.map((t) => ({
      externalId: t.id,
      accountExternalId: t.account_id,
      type: t.mode === 'fee' ? 'fee' : t.mode === 'transfer' ? 'transfer' : t.amount >= 0 ? 'deposit' : 'withdrawal',
      name: t.description,
      amount: t.amount,
      currency: t.currency_code,
      date: new Date(t.made_on),
      description: t.description,
    }));

    return { accounts, holdings: [], fees: [], dividends: [], transactions };
  }

  async refreshCredentials(refreshToken: string) {
    return { accessToken: refreshToken };
  }
}

const saltedge = new SaltEdgeConnector();
export default saltedge;
