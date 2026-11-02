import { BaseConnector } from '../base';
import { connectorError } from '../errors';
import { round2 } from '../signing';
import type { CallbackResult, ConnectionInitResult, NormalizedAccount, NormalizedHolding, ProviderSlug, SyncCredentials, SyncResult } from '../types';

/**
 * IBKR's OAuth Web API is reserved to approved third parties, and the previous
 * code called https://localhost:5000 (a gateway on the customer's own machine),
 * unreachable from a server. The way open to any account holder is the Flex Web
 * Service: the user creates, in Client Portal, a token and an Activity Flex Query
 * containing Open Positions, Account Information and Net Asset Value, and gives us
 * both. Stored as accessToken = token, apiSecret = query id.
 *
 * https://www.interactivebrokers.com/docs/web-api/flex-web-service
 * Limits: 1 request/s and 10/min per token; statements refresh once a day.
 *
 * isConfigured() stays false unless IBKR_FLEX_ENABLED=1: nothing to buy, but the attribute
 * names below must first be checked against one real statement.
 */
const FLEX = 'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService';
const USER_AGENT = 'Java/1.8'; // IBKR refuses requests without a recognised User-Agent.
const RETRYABLE = new Set(['1001', '1003', '1004', '1005', '1006', '1007', '1008', '1009', '1019', '1021']);

const decode = (s: string) => s
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function tagValue(xml: string, tag: string): string | undefined {
  const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return m ? decode(m[1].trim()) : undefined;
}

function elements(xml: string, tag: string): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  for (const m of xml.matchAll(new RegExp(`<${tag}\\s([^>]*?)/?>`, 'g'))) {
    const attrs: Record<string, string> = {};
    for (const a of m[1].matchAll(/([\w:.-]+)=(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = decode(a[2] ?? a[3] ?? '');
    out.push(attrs);
  }
  return out;
}

const ASSET_CLASSES: Record<string, string> = {
  STK: 'stocks', OPT: 'stocks', WAR: 'stocks', FUND: 'etf', BOND: 'bonds', BILL: 'bonds',
  FUT: 'commodities', CMDTY: 'commodities', CASH: 'cash', CRYPTO: 'crypto',
};

export function parseFlexStatement(xml: string): Pick<SyncResult, 'accounts' | 'holdings'> {
  const accounts: NormalizedAccount[] = [];
  const holdings: NormalizedHolding[] = [];
  for (const block of xml.split(/<FlexStatement\s/).slice(1)) {
    const section = `<FlexStatement ${block}`;
    const accountId = elements(section, 'FlexStatement')[0]?.accountId;
    if (!accountId) continue;
    // VERIFY: attribute names below come from IBKR's Flex reference; check against the
    // first real statement that the query template includes these sections.
    const info = elements(section, 'AccountInformation')[0];
    const nav = elements(section, 'EquitySummaryByReportDateInBase').at(-1);
    const baseCurrency = info?.currency || 'USD';
    let positionsValue = 0;
    for (const p of elements(section, 'OpenPosition')) {
      if (p.levelOfDetail && p.levelOfDetail !== 'SUMMARY') continue;
      const quantity = parseFloat(p.position) || 0;
      const currentPrice = parseFloat(p.markPrice) || 0;
      positionsValue += parseFloat(p.positionValue) * (parseFloat(p.fxRateToBase) || 1) || 0;
      holdings.push({
        externalId: `ibkr-${p.conid || p.symbol}`,
        accountExternalId: accountId,
        symbol: p.symbol,
        name: p.description || p.symbol,
        quantity,
        avgPrice: parseFloat(p.costBasisPrice) || currentPrice,
        currentPrice,
        currency: p.currency || baseCurrency,
        assetClass: ASSET_CLASSES[p.assetCategory] ?? 'other',
        sector: 'other',
        region: 'world',
        dailyChange: 0,
      });
    }
    const total = parseFloat(nav?.total ?? '');
    accounts.push({
      externalId: accountId,
      name: info?.name ? `IBKR ${accountId}` : `Interactive Brokers ${accountId}`,
      institution: 'Interactive Brokers',
      type: 'brokerage',
      // Without the NAV section the positions are the best figure available.
      balance: round2(Number.isFinite(total) ? total : positionsValue),
      currency: baseCurrency,
      color: '#34d399',
    });
  }
  return { accounts, holdings };
}

class IBKRConnector extends BaseConnector {
  readonly slug: ProviderSlug = 'ibkr';
  readonly displayName = 'Interactive Brokers';
  readonly region = 'world';

  isConfigured() {
    return process.env.IBKR_FLEX_ENABLED === '1';
  }

  async initiateConnection(): Promise<ConnectionInitResult> {
    return { type: 'api_key' };
  }

  async handleCallback(): Promise<CallbackResult> {
    throw connectorError('noRedirect', { provider: this.displayName });
  }

  private async flex(path: string, params: Record<string, string>): Promise<string> {
    const res = await fetch(`${FLEX}/${path}?${new URLSearchParams({ ...params, v: '3' })}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw connectorError('http', { provider: this.displayName, status: res.status });
    return res.text();
  }

  async sync({ accessToken: token, apiSecret: queryId }: SyncCredentials): Promise<SyncResult> {
    if (!token || !queryId) throw connectorError('ibkrKeysRequired');
    const sent = await this.flex('SendRequest', { t: token, q: queryId });
    const reference = tagValue(sent, 'ReferenceCode');
    if (tagValue(sent, 'Status') !== 'Success' || !reference) {
      throw connectorError('ibkrRefused', { code: tagValue(sent, 'ErrorCode') ?? '?' });
    }

    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise((r) => setTimeout(r, Number(process.env.IBKR_FLEX_WAIT_MS ?? 2000)));
      const statement = await this.flex('GetStatement', { t: token, q: reference });
      if (statement.includes('<FlexQueryResponse')) {
        return { ...parseFlexStatement(statement), fees: [], dividends: [], transactions: [] };
      }
      const code = tagValue(statement, 'ErrorCode') ?? '';
      if (!RETRYABLE.has(code)) throw connectorError('ibkrNoStatement', { code: code || '?' });
    }
    throw connectorError('ibkrTimeout');
  }

  async refreshCredentials(refreshToken: string) {
    return { accessToken: refreshToken };
  }
}

const ibkr = new IBKRConnector();
export default ibkr;
