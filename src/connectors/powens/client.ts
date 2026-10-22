import { BaseConnector } from '../base';
import { registerConnector } from '../registry';
import type {
  ProviderSlug,
  ConnectionInitResult,
  CallbackResult,
  SyncResult,
} from '../types';
import { normalizePowensData } from './normalizer';
import { verifyPowensWebhook } from './webhooks';

interface PowensTokenResponse {
  access_token: string;
  token_type: string;
}

interface PowensUserResponse {
  id: number;
  signin: string;
}

interface PowensAccount {
  id: number;
  id_connection: number;
  name: string;
  balance: number;
  currency: { id: string };
  type: string;
  last_update: string;
  iban?: string;
  number?: string;
  company_name?: string;
}

interface PowensInvestment {
  id: number;
  id_account: number;
  label: string;
  code: string;
  code_type: string;
  quantity: number;
  unitprice: number;
  unitvalue: number;
  valuation: number;
  diff: number;
  diff_percent: number;
  portfolio_share: number;
}

interface PowensTransaction {
  id: number;
  id_account: number;
  date: string;
  rdate: string;
  value: number;
  type: string;
  original_wording: string;
  simplified_wording: string;
  category?: { name: string };
}

export interface PowensRawData {
  accounts: PowensAccount[];
  investments: PowensInvestment[];
  transactions: PowensTransaction[];
}

const POWENS_DOMAIN = process.env.POWENS_DOMAIN || 'mstech-sandbox.biapi.pro';
const POWENS_CLIENT_ID = process.env.POWENS_CLIENT_ID || '';
const POWENS_CLIENT_SECRET = process.env.POWENS_CLIENT_SECRET || '';

class PowensConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'powens';
  readonly displayName = 'Powens (Budget Insight)';
  readonly region = 'France / EU';

  private get baseUrl() {
    return `https://${POWENS_DOMAIN}/2.0`;
  }

  private async getClientToken(): Promise<string> {
    const data = await this.fetchJson<PowensTokenResponse>(
      `${this.baseUrl}/auth/init`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: POWENS_CLIENT_ID,
          client_secret: POWENS_CLIENT_SECRET,
        }),
      }
    );
    return data.access_token;
  }

  async initiateConnection(
    _userId: string,
    callbackUrl: string
  ): Promise<ConnectionInitResult> {
    const token = await this.getClientToken();

    // Create a temporary user in Powens sandbox
    const user = await this.fetchJson<PowensUserResponse>(
      `${this.baseUrl}/auth/init`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: POWENS_CLIENT_ID,
          client_secret: POWENS_CLIENT_SECRET,
        }),
      }
    );

    const redirectUrl = `https://${POWENS_DOMAIN}/auth/webview/connect?client_id=${POWENS_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&token=${token}`;

    return {
      type: 'redirect',
      redirectUrl,
      connectionId: String(user.id),
    };
  }

  async handleCallback(
    params: Record<string, string>
  ): Promise<CallbackResult> {
    const { code, connection_id } = params;

    if (!code) {
      throw new Error('Missing authorization code from Powens callback');
    }

    const tokenData = await this.fetchJson<PowensTokenResponse>(
      `${this.baseUrl}/auth/token/access`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: POWENS_CLIENT_ID,
          client_secret: POWENS_CLIENT_SECRET,
          code,
        }),
      }
    );

    return {
      externalId: connection_id || '',
      accessToken: tokenData.access_token,
    };
  }

  async sync(accessToken: string): Promise<SyncResult> {
    const headers = { Authorization: `Bearer ${accessToken}` };

    const [accountsRes, investmentsRes, transactionsRes] = await Promise.all([
      this.fetchJson<{ accounts: PowensAccount[] }>(
        `${this.baseUrl}/users/me/accounts`,
        { headers }
      ),
      this.fetchJson<{ investments: PowensInvestment[] }>(
        `${this.baseUrl}/users/me/investments`,
        { headers }
      ).catch(() => ({ investments: [] as PowensInvestment[] })),
      this.fetchJson<{ transactions: PowensTransaction[] }>(
        `${this.baseUrl}/users/me/transactions?limit=500`,
        { headers }
      ).catch(() => ({ transactions: [] as PowensTransaction[] })),
    ]);

    const rawData: PowensRawData = {
      accounts: accountsRes.accounts || [],
      investments: investmentsRes.investments || [],
      transactions: transactionsRes.transactions || [],
    };

    return normalizePowensData(rawData);
  }

  async refreshCredentials(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const data = await this.fetchJson<PowensTokenResponse>(
      `${this.baseUrl}/auth/token/access`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: POWENS_CLIENT_ID,
          client_secret: POWENS_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      }
    );

    return { accessToken: data.access_token };
  }

  verifyWebhook(body: string, signature: string): boolean {
    return verifyPowensWebhook(body, signature);
  }
}

const powens = new PowensConnector();
registerConnector('powens', () => powens);
export default powens;
