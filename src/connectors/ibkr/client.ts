import { BaseConnector } from '../base';
import { registerConnector } from '../registry';
import type {
  ProviderSlug,
  ConnectionInitResult,
  CallbackResult,
  SyncResult,
  NormalizedAccount,
  NormalizedHolding,
} from '../types';

interface IBKRPosition {
  acctId: string;
  conid: number;
  ticker: string;
  name: string;
  position: number;
  avgCost: number;
  mktPrice: number;
  mktValue: number;
  currency: string;
  assetClass: string;
  unrealizedPnl: number;
}

interface IBKRAccount {
  id: string;
  accountId: string;
  accountTitle: string;
  type: string;
  currency: string;
}

interface IBKRAccountSummary {
  totalcashvalue: { amount: number; currency: string };
  netliquidation: { amount: number; currency: string };
}

const IBKR_CLIENT_ID = process.env.IBKR_CLIENT_ID || '';
const IBKR_CLIENT_SECRET = process.env.IBKR_CLIENT_SECRET || '';
const IBKR_BASE_URL = 'https://localhost:5000/v1/api';

class IBKRConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'ibkr';
  readonly displayName = 'Interactive Brokers';
  readonly region = 'Global';

  async initiateConnection(_userId: string, callbackUrl: string): Promise<ConnectionInitResult> {
    const redirectUrl = `https://www.interactivebrokers.com/authorize?client_id=${IBKR_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=read`;
    return { type: 'redirect', redirectUrl };
  }

  async handleCallback(params: Record<string, string>): Promise<CallbackResult> {
    const { code } = params;
    if (!code) throw new Error('Missing authorization code from IBKR callback');

    const tokenData = await this.fetchJson<{ access_token: string; refresh_token?: string; expires_in?: number }>(
      'https://www.interactivebrokers.com/oauth/token',
      {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: IBKR_CLIENT_ID,
          client_secret: IBKR_CLIENT_SECRET,
          code,
        }),
      }
    );

    return {
      externalId: 'ibkr',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined,
    };
  }

  async sync(accessToken: string): Promise<SyncResult> {
    const headers = { Authorization: `Bearer ${accessToken}` };

    // Get accounts
    const ibkrAccounts = await this.fetchJson<IBKRAccount[]>(
      `${IBKR_BASE_URL}/portfolio/accounts`,
      { headers }
    ).catch(() => [] as IBKRAccount[]);

    const allPositions: IBKRPosition[] = [];
    const accountSummaries = new Map<string, IBKRAccountSummary>();

    for (const acct of ibkrAccounts) {
      const positions = await this.fetchJson<IBKRPosition[]>(
        `${IBKR_BASE_URL}/portfolio/${acct.accountId}/positions/0`,
        { headers }
      ).catch(() => [] as IBKRPosition[]);
      allPositions.push(...positions);

      const summary = await this.fetchJson<IBKRAccountSummary>(
        `${IBKR_BASE_URL}/portfolio/${acct.accountId}/summary`,
        { headers }
      ).catch(() => null);
      if (summary) accountSummaries.set(acct.accountId, summary);
    }

    const ASSET_CLASS_MAP: Record<string, string> = {
      STK: 'stocks', OPT: 'stocks', FUT: 'commodities',
      CASH: 'cash', BOND: 'bonds', FUND: 'etf',
      CRYPTO: 'crypto',
    };

    const accounts: NormalizedAccount[] = ibkrAccounts.map((a) => {
      const summary = accountSummaries.get(a.accountId);
      return {
        externalId: a.accountId,
        name: a.accountTitle || `IBKR ${a.accountId}`,
        institution: 'Interactive Brokers',
        type: 'brokerage',
        balance: summary?.netliquidation?.amount || 0,
        currency: a.currency || 'USD',
        color: '#34d399',
      };
    });

    const holdings: NormalizedHolding[] = allPositions.map((p) => ({
      externalId: `ibkr-${p.conid}`,
      symbol: p.ticker,
      name: p.name,
      quantity: p.position,
      avgPrice: p.avgCost,
      currentPrice: p.mktPrice,
      currency: p.currency,
      assetClass: ASSET_CLASS_MAP[p.assetClass] || 'stocks',
      sector: 'Other',
      region: 'Global',
      dailyChange: p.mktValue > 0 ? (p.unrealizedPnl / (p.mktValue - p.unrealizedPnl)) * 100 : 0,
    }));

    return { accounts, holdings, fees: [], dividends: [], transactions: [] };
  }

  async refreshCredentials(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const tokenData = await this.fetchJson<{ access_token: string; refresh_token?: string; expires_in?: number }>(
      'https://www.interactivebrokers.com/oauth/token',
      {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: IBKR_CLIENT_ID,
          client_secret: IBKR_CLIENT_SECRET,
          refresh_token: refreshToken,
        }),
      }
    );

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined,
    };
  }
}

const ibkr = new IBKRConnector();
registerConnector('ibkr', () => ibkr);
export default ibkr;
