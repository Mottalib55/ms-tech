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
} from '../types';

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

interface BinanceAccountInfo {
  balances: BinanceBalance[];
}

interface BinanceTicker {
  symbol: string;
  price: string;
}

const BINANCE_BASE_URL = 'https://api.binance.com';

class BinanceConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'binance';
  readonly displayName = 'Binance';
  readonly region = 'Global';

  private sign(queryString: string, apiSecret: string): string {
    return createHmac('sha256', apiSecret).update(queryString).digest('hex');
  }

  async initiateConnection(): Promise<ConnectionInitResult> {
    return { type: 'api_key' };
  }

  async handleCallback(params: Record<string, string>): Promise<CallbackResult> {
    return {
      externalId: 'binance',
      accessToken: params.apiKey || '',
      metadata: { apiSecret: params.apiSecret || '' },
    };
  }

  async sync(apiKey: string, apiSecret?: string): Promise<SyncResult> {
    if (!apiKey || !apiSecret) {
      throw new Error('Binance API key and secret are required');
    }

    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = this.sign(queryString, apiSecret);

    const accountInfo = await this.fetchJson<BinanceAccountInfo>(
      `${BINANCE_BASE_URL}/api/v3/account?${queryString}&signature=${signature}`,
      { headers: { 'X-MBX-APIKEY': apiKey } }
    );

    // Get current prices
    const tickers = await this.fetchJson<BinanceTicker[]>(
      `${BINANCE_BASE_URL}/api/v3/ticker/price`
    );
    const priceMap = new Map<string, number>();
    for (const t of tickers) {
      priceMap.set(t.symbol, parseFloat(t.price));
    }

    const significantBalances = accountInfo.balances.filter((b) => {
      const total = parseFloat(b.free) + parseFloat(b.locked);
      return total > 0;
    });

    const totalUSDT = significantBalances.reduce((sum, b) => {
      const qty = parseFloat(b.free) + parseFloat(b.locked);
      if (b.asset === 'USDT' || b.asset === 'BUSD') return sum + qty;
      const price = priceMap.get(`${b.asset}USDT`) || 0;
      return sum + qty * price;
    }, 0);

    const accounts: NormalizedAccount[] = [{
      externalId: 'binance-spot',
      name: 'Binance Spot',
      institution: 'Binance',
      type: 'crypto',
      balance: Math.round(totalUSDT * 100) / 100,
      currency: 'USD',
      color: '#f97316',
    }];

    const holdings: NormalizedHolding[] = significantBalances.map((b) => {
      const qty = parseFloat(b.free) + parseFloat(b.locked);
      const usdtPrice = b.asset === 'USDT' || b.asset === 'BUSD'
        ? 1
        : priceMap.get(`${b.asset}USDT`) || 0;
      return {
        externalId: `binance-${b.asset}`,
        symbol: b.asset,
        name: b.asset,
        quantity: qty,
        avgPrice: usdtPrice,
        currentPrice: usdtPrice,
        currency: 'USD',
        assetClass: 'crypto',
        sector: 'Crypto',
        region: 'Global',
        dailyChange: 0,
      };
    });

    return { accounts, holdings, fees: [], dividends: [], transactions: [] };
  }

  async refreshCredentials(refreshToken: string): Promise<{ accessToken: string }> {
    return { accessToken: refreshToken };
  }
}

const binance = new BinanceConnector();
registerConnector('binance', () => binance);
export default binance;
