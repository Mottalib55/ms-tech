import { BaseConnector } from '../base';
import { registerConnector } from '../registry';
import type {
  ProviderSlug,
  ConnectionInitResult,
  CallbackResult,
  SyncResult,
} from '../types';

interface CoinGeckoPrice {
  [coinId: string]: {
    usd: number;
    eur: number;
    usd_24h_change?: number;
  };
}

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || '';
const COINGECKO_BASE_URL = COINGECKO_API_KEY
  ? 'https://pro-api.coingecko.com/api/v3'
  : 'https://api.coingecko.com/api/v3';

class CoinGeckoConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'coingecko';
  readonly displayName = 'CoinGecko';
  readonly region = 'Global';

  private get headers(): Record<string, string> {
    return COINGECKO_API_KEY
      ? { 'x-cg-pro-api-key': COINGECKO_API_KEY }
      : {};
  }

  async initiateConnection(): Promise<ConnectionInitResult> {
    // CoinGecko is API-key based, no OAuth flow needed
    return { type: 'api_key' };
  }

  async handleCallback(_params: Record<string, string>): Promise<CallbackResult> {
    return { externalId: 'coingecko' };
  }

  async sync(_accessToken: string): Promise<SyncResult> {
    // CoinGecko doesn't provide portfolio data, just prices
    return { accounts: [], holdings: [], fees: [], dividends: [], transactions: [] };
  }

  async refreshCredentials(_refreshToken: string): Promise<{ accessToken: string }> {
    return { accessToken: '' };
  }

  async getPrices(coinIds: string[]): Promise<CoinGeckoPrice> {
    if (coinIds.length === 0) return {};
    const ids = coinIds.join(',');
    return this.fetchJson<CoinGeckoPrice>(
      `${COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd,eur&include_24hr_change=true`,
      { headers: this.headers }
    );
  }

  async getMarketData(currency = 'eur', perPage = 50): Promise<CoinGeckoMarketData[]> {
    return this.fetchJson<CoinGeckoMarketData[]>(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=1`,
      { headers: this.headers }
    );
  }
}

const coingecko = new CoinGeckoConnector();
registerConnector('coingecko', () => coingecko);
export default coingecko;
export type { CoinGeckoPrice, CoinGeckoMarketData };
