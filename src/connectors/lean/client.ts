import { BaseConnector } from '../base';
import { round2, seal, sealOk, withQuery } from '../signing';
import type {
  CallbackResult, ConnectionInitResult, NormalizedAccount, NormalizedTransaction, ProviderSlug, SyncCredentials, SyncResult,
} from '../types';

interface LeanEntity { id: string; bank_identifier?: string }
interface LeanAccount {
  account_id: string;
  account_holder_name?: string;
  nickname?: string;
  description?: string;
  account_sub_type?: string;
  currency?: string;
}
interface LeanMoney { amount: number; currency?: string }
interface LeanBalance { type?: string; credit_debit_indicator?: string; amount: LeanMoney }
interface LeanTransaction {
  transaction_id: string;
  amount: LeanMoney;
  credit_debit_indicator?: string;
  booking_date_time?: string;
  value_date_time?: string;
  transaction_information?: string;
}
interface LeanResult<T> { status: string; message?: string; data: T }
interface LeanPage { number: number; total_pages: number }

const BALANCE_ORDER = ['INTERIM_AVAILABLE', 'CLOSING_AVAILABLE', 'INTERIM_BOOKED', 'CLOSING_BOOKED', 'EXPECTED', 'OPENING_AVAILABLE', 'OPENING_BOOKED'];
const PERMISSIONS = ['identity', 'accounts', 'balance', 'transactions'];

/**
 * Lean Open Finance (UAE / KSA):
 * https://docs.leantech.me/docs/lean-open-finance-data-integration-guide,
 * /reference/fetchaccountsv2, /reference/fetchbalancesv2, /reference/fetchtransactionsv2
 *
 * Lean has no hosted page: consent runs in its Link SDK, in a page of ours
 * (/api/webhooks/lean/link). The redirect does not carry the entity id, so what we
 * store is the customer id, and each sync lists that customer's entities.
 */
class LeanConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'lean';
  readonly displayName = 'Lean (Émirats, Arabie saoudite)';
  readonly region = 'Moyen-Orient';

  private get base() {
    // Sandbox: https://sandbox.leantech.me. Production: https://api2.leantech.me per the
    // reference. VERIFY: some guides show api.leantech.me; confirm with the production account.
    return process.env.LEAN_BASE_URL || 'https://sandbox.leantech.me';
  }

  get isSandbox() {
    return this.base.includes('sandbox');
  }

  isConfigured() {
    return !!(process.env.LEAN_APP_TOKEN && process.env.LEAN_CLIENT_ID && process.env.LEAN_CLIENT_SECRET);
  }

  /** Scope `api` for our backend, `customer.<id>` for the SDK in the browser. */
  async token(scope: string): Promise<string> {
    const auth = this.isSandbox ? 'https://auth.sandbox.leantech.me' : 'https://auth.leantech.me';
    const res = await fetch(`${auth}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.LEAN_CLIENT_ID ?? '',
        client_secret: process.env.LEAN_CLIENT_SECRET ?? '',
        grant_type: 'client_credentials',
        scope,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`[lean] token ${res.status}`);
      throw new Error(`${this.displayName} a répondu avec une erreur (${res.status}).`);
    }
    return ((await res.json()) as { access_token: string }).access_token;
  }

  async initiateConnection(userId: string, callbackUrl: string, state: string): Promise<ConnectionInitResult> {
    const token = await this.token('api');
    const { customer_id: customerId } = await this.fetchJson<{ customer_id: string }>(`${this.base}/customers/v1/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      // VERIFY: a second call for the same app_user_id may answer an error instead of the
      // existing customer; if so, use a fresh app_user_id per connection.
      body: JSON.stringify({ app_user_id: `${userId}-${state.slice(0, 12)}` }),
    });
    const origin = new URL(callbackUrl).origin;
    const fields = { customer_id: customerId, state, return: callbackUrl };
    return {
      type: 'redirect',
      redirectUrl: withQuery(`${origin}/api/webhooks/lean/link`, {
        ...fields,
        sig: seal(`lean-link|${customerId}|${state}|${callbackUrl}`),
      }),
      connectionId: customerId,
    };
  }

  /** The URLs the SDK returns to, with the customer id sealed so it cannot be swapped. */
  returnUrls(customerId: string, state: string, callbackUrl: string) {
    return {
      success: withQuery(callbackUrl, { state, customer_id: customerId, sig: seal(`lean|${customerId}`) }),
      failure: withQuery(callbackUrl, { state, error: 'denied' }),
    };
  }

  async handleCallback(params: Record<string, string>): Promise<CallbackResult> {
    const { customer_id: customerId, sig } = params;
    if (!customerId || !sealOk(`lean|${customerId}`, sig)) throw new Error('Retour Lean non authentifié.');
    return { externalId: customerId, accessToken: customerId };
  }

  private checked<T>(res: LeanResult<T>): T {
    if (res.status === 'CONSENT_EXPIRED' || res.status === 'RECONNECT_REQUIRED') {
      throw new Error('Lean : le consentement a expiré, reconnectez le compte.');
    }
    if (res.status === 'FAILED') throw new Error('Lean n\'a pas pu récupérer les données.');
    return res.data;
  }

  async sync({ accessToken: customerId }: SyncCredentials): Promise<SyncResult> {
    const token = await this.token('api');
    const headers = { Authorization: `Bearer ${token}` };
    const entities = await this.fetchJson<LeanEntity[]>(`${this.base}/customers/v1/${customerId}/entities`, { headers });

    const accounts: NormalizedAccount[] = [];
    const transactions: NormalizedTransaction[] = [];
    for (const entity of entities) {
      const q = `entity_id=${entity.id}`;
      const res = this.checked(await this.fetchJson<LeanResult<{ accounts: LeanAccount[] }>>(`${this.base}/data/v2/accounts?${q}&size=100`, { headers }));
      for (const a of res.accounts ?? []) {
        const balances = this.checked(await this.fetchJson<LeanResult<{ balances: LeanBalance[] }>>(
          `${this.base}/data/v2/accounts/${a.account_id}/balances?${q}`, { headers },
        )).balances ?? [];
        const rank = (b: LeanBalance) => {
          const i = BALANCE_ORDER.indexOf(b.type ?? '');
          return i < 0 ? BALANCE_ORDER.length : i;
        };
        const best = [...balances].sort((x, y) => rank(x) - rank(y))[0];
        const amount = best?.amount?.amount ?? 0;
        const signed = best?.credit_debit_indicator === 'DEBIT' ? -Math.abs(amount) : amount;
        const currency = a.currency || best?.amount?.currency || 'AED';
        // VERIFY: exact account_sub_type values for loans and cards on a real entity.
        const isDebt = /loan|mortgage|credit/i.test(a.account_sub_type ?? '');
        accounts.push({
          externalId: a.account_id,
          name: a.nickname || a.description || a.account_holder_name || 'Compte',
          institution: entity.bank_identifier || 'Banque',
          type: isDebt ? 'loan' : 'bank',
          balance: round2(isDebt ? Math.abs(signed) : signed),
          currency,
          color: isDebt ? '#f87171' : '#5682f2',
        });

        for (let page = 0; page < 10; page++) {
          const tx = this.checked(await this.fetchJson<LeanResult<{ transactions: LeanTransaction[]; page?: LeanPage }>>(
            `${this.base}/data/v2/accounts/${a.account_id}/transactions?${q}&size=100&page=${page}`, { headers },
          ));
          for (const t of tx.transactions ?? []) {
            const value = t.credit_debit_indicator === 'DEBIT' ? -Math.abs(t.amount.amount) : Math.abs(t.amount.amount);
            transactions.push({
              externalId: t.transaction_id,
              accountExternalId: a.account_id,
              type: value >= 0 ? 'deposit' : 'withdrawal',
              name: t.transaction_information,
              amount: value,
              currency: t.amount.currency || currency,
              date: new Date(t.booking_date_time || t.value_date_time || Date.now()),
              description: t.transaction_information,
            });
          }
          if (!tx.page || tx.page.number + 1 >= tx.page.total_pages) break;
        }
      }
    }
    return { accounts, holdings: [], fees: [], dividends: [], transactions };
  }

  async refreshCredentials(refreshToken: string) {
    return { accessToken: refreshToken };
  }
}

const lean = new LeanConnector();
export default lean;
