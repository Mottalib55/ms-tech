import { createHmac } from 'node:crypto';
import { BaseConnector } from '../base';
import { connectorError } from '../errors';
import { round2 } from '../signing';
import type { CallbackResult, ConnectionInitResult, NormalizedHolding, ProviderSlug, SyncCredentials, SyncResult } from '../types';

interface BinanceAccountInfo {
  balances: { asset: string; free: string; locked: string }[];
}

const BASE_URL = 'https://api.binance.com';
const DOLLARS = new Set(['USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'DAI', 'USD']);

/**
 * https://developers.binance.com/docs/binance-spot-api-docs/rest-api/account-endpoints
 * Each user supplies their own read-only key; there is nothing to configure on our side.
 * api.binance.com refuses some cloud regions (HTTP 451 from the US): deploy accordingly.
 */
class BinanceConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'binance';
  readonly displayName = 'Binance';
  readonly region = 'world';

  isConfigured() {
    return true;
  }

  async initiateConnection(): Promise<ConnectionInitResult> {
    return { type: 'api_key' };
  }

  async handleCallback(): Promise<CallbackResult> {
    throw connectorError('noRedirect', { provider: this.displayName });
  }

  async sync({ accessToken: apiKey, apiSecret }: SyncCredentials): Promise<SyncResult> {
    if (!apiKey || !apiSecret) throw connectorError('binanceKeysRequired');

    const query = `omitZeroBalances=true&recvWindow=10000&timestamp=${Date.now()}`;
    const signature = createHmac('sha256', apiSecret).update(query).digest('hex');
    const info = await this.fetchJson<BinanceAccountInfo>(`${BASE_URL}/api/v3/account?${query}&signature=${signature}`, {
      headers: { 'X-MBX-APIKEY': apiKey },
    });
    const tickers = await this.fetchJson<{ symbol: string; price: string }[]>(`${BASE_URL}/api/v3/ticker/price`);
    const prices = new Map(tickers.map((t) => [t.symbol, parseFloat(t.price)]));

    const priceOf = (asset: string): number => {
      if (DOLLARS.has(asset)) return 1;
      // VERIFY: Simple Earn balances are seen as LD<asset>, with no market of their own; not in the docs.
      const base = asset.startsWith('LD') && !prices.has(`${asset}USDT`) ? asset.slice(2) : asset;
      if (DOLLARS.has(base)) return 1;
      // An asset with no USDT pair is kept with a zero value rather than failing the sync.
      return prices.get(`${base}USDT`) ?? 0;
    };

    const holdings: NormalizedHolding[] = [];
    let total = 0;
    for (const b of info.balances) {
      const quantity = parseFloat(b.free) + parseFloat(b.locked);
      if (!(quantity > 0)) continue;
      const price = priceOf(b.asset);
      total += quantity * price;
      holdings.push({
        externalId: `binance-${b.asset}`,
        accountExternalId: 'binance-spot',
        symbol: b.asset,
        name: b.asset,
        quantity,
        // Binance does not report a cost basis: gain shows as zero rather than invented.
        avgPrice: price,
        currentPrice: price,
        currency: 'USD',
        assetClass: DOLLARS.has(b.asset) ? 'cash' : 'crypto',
        sector: 'crypto',
        region: 'world',
        dailyChange: 0,
      });
    }

    return {
      accounts: [{
        externalId: 'binance-spot', name: 'Binance Spot', institution: 'Binance', type: 'crypto',
        balance: round2(total), currency: 'USD', color: '#f97316',
      }],
      holdings, fees: [], dividends: [], transactions: [],
    };
  }

  async refreshCredentials(refreshToken: string) {
    return { accessToken: refreshToken };
  }
}

const binance = new BinanceConnector();
export default binance;
