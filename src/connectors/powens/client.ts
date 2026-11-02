import { BaseConnector } from '../base';
import { withQuery } from '../signing';
import type { CallbackResult, ConnectionInitResult, ProviderSlug, SyncCredentials, SyncResult } from '../types';
import { normalizePowensData } from './normalizer';

interface PowensAccount {
  id: number;
  id_connection?: number;
  name?: string | null;
  original_name?: string | null;
  balance?: number | null;
  currency?: { id: string } | null;
  type?: string | null;
  company_name?: string | null;
  loan?: { total_amount?: number | null } | null;
}

interface PowensInvestment {
  id: number;
  id_account: number;
  label: string;
  code?: string | null;
  code_type?: string | null;
  stock_symbol?: string | null;
  quantity?: number | null;
  unitprice?: number | null;
  unitvalue?: number | null;
  prev_diff_percent?: number | null;
  details?: { asset_category?: string | null } | null;
}

interface PowensTransaction {
  id: number;
  id_account: number;
  date: string;
  rdate?: string | null;
  value: number;
  type?: string | null;
  original_wording?: string | null;
  simplified_wording?: string | null;
}

export interface PowensRawData {
  accounts: PowensAccount[];
  investments: PowensInvestment[];
  transactions: PowensTransaction[];
}

/**
 * Docs: https://docs.powens.com/api-reference/overview/webview and
 * https://docs.powens.com/api-reference/overview/authentication
 *
 * We open the webview WITHOUT a `code`: Powens creates the user and returns a
 * `code` with `connection_id` on the callback, exchanged for a permanent token at
 * POST /auth/token/access. So each connection is its own Powens user, whose
 * permanent token is what we encrypt and store.
 * VERIFY: redirect_uri must be on the allow-list in the Powens console.
 */
class PowensConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'powens';
  readonly displayName = 'Powens (banques, PEA, assurance-vie)';
  readonly region = 'France / Europe';

  private get domain() {
    // Accepts "example" or "example.biapi.pro".
    const d = process.env.POWENS_DOMAIN ?? '';
    return d && !d.includes('.') ? `${d}.biapi.pro` : d;
  }

  private get baseUrl() {
    return `https://${this.domain}/2.0`;
  }

  isConfigured() {
    return !!(this.domain && process.env.POWENS_CLIENT_ID && process.env.POWENS_CLIENT_SECRET);
  }

  async initiateConnection(_userId: string, callbackUrl: string, state: string): Promise<ConnectionInitResult> {
    return {
      type: 'redirect',
      redirectUrl: withQuery('https://webview.powens.com/fr/connect', {
        domain: this.domain,
        client_id: process.env.POWENS_CLIENT_ID ?? '',
        redirect_uri: callbackUrl,
        state,
      }),
    };
  }

  async handleCallback(params: Record<string, string>): Promise<CallbackResult> {
    if (!params.code) throw new Error('Powens n\'a pas renvoyé de code d\'autorisation.');
    const token = await this.fetchJson<{ access_token: string }>(`${this.baseUrl}/auth/token/access`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: process.env.POWENS_CLIENT_ID,
        client_secret: process.env.POWENS_CLIENT_SECRET,
        code: params.code,
      }),
    });
    return { externalId: params.connection_id ?? '', accessToken: token.access_token };
  }

  async sync({ accessToken }: SyncCredentials): Promise<SyncResult> {
    const headers = { Authorization: `Bearer ${accessToken}` };
    // Accounts decide whether the sync worked. Investments and transactions depend on
    // the products enabled on the Powens contract, so only their "not in plan" answer is tolerated.
    const accounts = await this.fetchJson<{ accounts: PowensAccount[] }>(`${this.baseUrl}/users/me/accounts`, { headers });
    const [investments, transactions] = await Promise.all([
      this.optional<{ investments: PowensInvestment[] }>(`${this.baseUrl}/users/me/investments`, headers, { investments: [] }),
      this.optional<{ transactions: PowensTransaction[] }>(`${this.baseUrl}/users/me/transactions?limit=500`, headers, { transactions: [] }),
    ]);
    return normalizePowensData({
      accounts: accounts.accounts ?? [],
      investments: investments.investments ?? [],
      transactions: transactions.transactions ?? [],
    });
  }

  private async optional<T>(url: string, headers: Record<string, string>, empty: T): Promise<T> {
    try {
      return await this.fetchJson<T>(url, { headers });
    } catch (error) {
      if (error instanceof Error && /\((403|404)\)/.test(error.message)) return empty;
      throw error;
    }
  }

  async refreshCredentials(refreshToken: string) {
    // Powens user tokens are permanent: nothing to refresh.
    return { accessToken: refreshToken };
  }
}

const powens = new PowensConnector();
export default powens;
