import { BaseConnector } from '../base';
import { connectorError } from '../errors';
import { translate } from '@/server/i18n';
import type { Locale } from '@/i18n/routing';
import type { CallbackResult, ConnectionInitResult, ProviderSlug, SyncCredentials, SyncResult } from '../types';

/**
 * A pretend bank, driving the exact path a real provider takes (redirect,
 * consent, callback, encrypted token, sync, webhookless refresh). Used by demo
 * accounts and the tests; never offered to a real account in production.
 */
class SandboxConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'sandbox';
  readonly displayName = 'Demo bank';
  readonly region = 'demo';

  isConfigured() {
    return true;
  }

  async initiateConnection(_userId: string, callbackUrl: string, state: string): Promise<ConnectionInitResult> {
    const params = new URLSearchParams({ state, redirect: callbackUrl });
    return { type: 'redirect', redirectUrl: `/connect/sandbox?${params}` };
  }

  async handleCallback(params: Record<string, string>): Promise<CallbackResult> {
    if (!params.code) throw connectorError('refused');
    return { externalId: `sandbox-${Date.now()}`, accessToken: params.code };
  }

  async sync({ accessToken, locale }: SyncCredentials): Promise<SyncResult> {
    if (accessToken === 'expired') throw connectorError('consentExpired', { provider: this.displayName });
    const lang = (locale ?? 'en') as Locale;
    const l = (key: string) => translate(`server.sandbox.${key}`, undefined, lang);
    const bank = await l('bank');
    const today = new Date();
    const day = (n: number) => new Date(today.getTime() - n * 86_400_000);
    return {
      accounts: [
        { externalId: 'chk', name: await l('checking'), institution: bank, type: 'bank', balance: 3250.4, currency: 'EUR', color: '#5682f2' },
        { externalId: 'pea', name: await l('brokerage'), institution: bank, type: 'brokerage', balance: 18240.5, currency: 'EUR', color: '#f4be7e' },
      ],
      holdings: [
        { externalId: 'cw8', accountExternalId: 'pea', symbol: 'CW8', name: 'Amundi MSCI World UCITS ETF', quantity: 30, avgPrice: 410, currentPrice: 498.35, currency: 'EUR', assetClass: 'etf', sector: 'diversified', region: 'world', dailyChange: 0.42 },
        { externalId: 'mc', accountExternalId: 'pea', symbol: 'MC', name: 'LVMH', quantity: 4, avgPrice: 690, currentPrice: 640, currency: 'EUR', assetClass: 'stocks', sector: 'luxury', region: 'france', dailyChange: -0.8 },
      ],
      fees: [
        { accountExternalId: 'pea', accountName: await l('brokerage'), type: 'custody', label: await l('custody'), amount: 36, percentage: 0.2, frequency: 'annual', suggestion: await l('custodyHint'), alternativeFee: 0 },
      ],
      dividends: [
        { holdingExternalId: 'mc', symbol: 'MC', name: 'LVMH', amount: 22, currency: 'EUR', exDate: day(120).toISOString().slice(0, 10), payDate: day(118).toISOString().slice(0, 10), status: 'paid', frequency: 'semi-annual' },
      ],
      transactions: [
        { externalId: 't1', accountExternalId: 'chk', type: 'deposit', name: await l('salary'), amount: 3200, currency: 'EUR', date: day(3), description: await l('salaryDesc') },
        { externalId: 't2', accountExternalId: 'chk', type: 'withdrawal', name: await l('rent'), amount: -950, currency: 'EUR', date: day(2), description: await l('rentDesc') },
        { externalId: 't3', accountExternalId: 'pea', type: 'buy', symbol: 'CW8', name: await l('buyCw8'), amount: -498.35, quantity: 1, price: 498.35, currency: 'EUR', date: day(9), description: await l('buyCw8Desc') },
      ],
    };
  }

  async refreshCredentials(refreshToken: string) {
    return { accessToken: refreshToken };
  }
}

const sandbox = new SandboxConnector();
export default sandbox;
