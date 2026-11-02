import { createHmac, createSign, generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import binance from '@/connectors/binance/client';
import ibkr, { parseFlexStatement } from '@/connectors/ibkr/client';
import lean from '@/connectors/lean/client';
import { verifyLeanWebhook } from '@/connectors/lean/webhooks';
import powens from '@/connectors/powens/client';
import { guessAssetClass, normalizePowensData } from '@/connectors/powens/normalizer';
import { verifyPowensWebhook } from '@/connectors/powens/webhooks';
import saltedge from '@/connectors/saltedge/client';
import { verifySaltEdgeWebhook } from '@/connectors/saltedge/webhooks';
import { seal } from '@/connectors/signing';

type Handler = (url: string, init?: RequestInit) => unknown;
const json = (body: unknown, status = 200) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

function mockFetch(handler: Handler) {
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const out = handler(String(input), init);
    return out instanceof Response ? out : json(out);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  vi.stubEnv('ENCRYPTION_KEY', 'k'.repeat(64));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('isConfigured', () => {
  it('is false without keys, true with them', () => {
    for (const k of ['POWENS_DOMAIN', 'POWENS_CLIENT_ID', 'POWENS_CLIENT_SECRET', 'LEAN_APP_TOKEN', 'LEAN_CLIENT_ID', 'LEAN_CLIENT_SECRET', 'SALTEDGE_APP_ID', 'SALTEDGE_SECRET', 'IBKR_FLEX_ENABLED']) vi.stubEnv(k, '');
    expect([powens, lean, saltedge, ibkr].map((c) => c.isConfigured())).toEqual([false, false, false, false]);
    expect(binance.isConfigured()).toBe(true);
    vi.stubEnv('POWENS_DOMAIN', 'demo'); vi.stubEnv('POWENS_CLIENT_ID', 'id'); vi.stubEnv('POWENS_CLIENT_SECRET', 's');
    expect(powens.isConfigured()).toBe(true);
  });
});

describe('powens', () => {
  beforeEach(() => {
    vi.stubEnv('POWENS_DOMAIN', 'demo');
    vi.stubEnv('POWENS_CLIENT_ID', 'cid');
    vi.stubEnv('POWENS_CLIENT_SECRET', 'sec');
  });

  it('opens the documented webview with state and no code', async () => {
    const { redirectUrl } = await powens.initiateConnection('u1', 'https://app.test/api/connections/callback', 'ST/1');
    const url = new URL(redirectUrl!);
    expect(url.host).toBe('webview.powens.com');
    expect(url.pathname).toBe('/fr/connect');
    expect(url.searchParams.get('domain')).toBe('demo.biapi.pro');
    expect(url.searchParams.get('state')).toBe('ST/1');
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.test/api/connections/callback');
    expect(url.searchParams.has('code')).toBe(false);
  });

  it('exchanges the callback code for a permanent token', async () => {
    const f = mockFetch(() => ({ access_token: 'perm', token_type: 'Bearer' }));
    const out = await powens.handleCallback({ code: 'abc', connection_id: '42' });
    expect(out).toEqual({ externalId: '42', accessToken: 'perm' });
    expect(String(f.mock.calls[0][0])).toBe('https://demo.biapi.pro/2.0/auth/token/access');
    await expect(powens.handleCallback({})).rejects.toThrow();
  });

  it('normalizes accounts, loans and holdings onto their own account', () => {
    const out = normalizePowensData({
      accounts: [
        { id: 1, name: 'Courant', balance: 100, currency: { id: 'EUR' }, type: 'checking', company_name: 'BNP' },
        { id: 2, name: 'PEA', balance: 900, currency: { id: 'EUR' }, type: 'pea' },
        { id: 3, name: 'Immo', balance: -150000, currency: { id: 'EUR' }, type: 'loan' },
        { id: 4, name: 'AV', balance: 50, currency: { id: 'USD' }, type: 'lifeinsurance' },
      ],
      investments: [{ id: 9, id_account: 2, label: 'Amundi MSCI World ETF', code: 'FR0010315770', code_type: 'ISIN', quantity: 2, unitprice: 400, unitvalue: 450 }],
      transactions: [{ id: 7, id_account: 1, date: '2026-10-01', value: -12.5, type: 'card', original_wording: 'CB' }],
    });
    expect(out.accounts.map((a) => a.type)).toEqual(['bank', 'brokerage', 'loan', 'insurance']);
    expect(out.accounts[2].balance).toBe(150000);
    expect(out.holdings[0]).toMatchObject({ accountExternalId: '2', assetClass: 'etf', avgPrice: 400, currentPrice: 450 });
    expect(out.transactions[0]).toMatchObject({ accountExternalId: '1', type: 'withdrawal' });
  });

  it('does not read an FR ISIN as proof of a share', () => {
    expect(guessAssetClass('Fonds euros Generali', null, 'ISIN')).toBe('bonds');
    expect(guessAssetClass('SICAV Prudence', null, 'AMF')).toBe('other');
    expect(guessAssetClass('LVMH', 'Equities', 'ISIN')).toBe('stocks');
  });

  it('fails when accounts fail, tolerates a product not on the contract', async () => {
    mockFetch(() => json('nope', 500));
    await expect(powens.sync({ accessToken: 't' })).rejects.toThrow('500');
    mockFetch((url) => (url.includes('/accounts') ? { accounts: [] } : json('forbidden', 403)));
    await expect(powens.sync({ accessToken: 't' })).resolves.toMatchObject({ accounts: [], holdings: [] });
    mockFetch((url) => (url.includes('/accounts') ? { accounts: [] } : json('boom', 500)));
    await expect(powens.sync({ accessToken: 't' })).rejects.toThrow('500');
  });

  it('verifies the documented signature', () => {
    vi.stubEnv('POWENS_WEBHOOK_SECRET', 'whsec');
    const date = '2022-06-27T11:08:52.577831Z';
    const body = '{"id":1}';
    const sig = createHmac('sha256', 'whsec').update(`POST./api/webhooks/powens.${date}.${body}`).digest('base64');
    expect(verifyPowensWebhook(body, sig, date, '/api/webhooks/powens')).toBe(true);
    expect(verifyPowensWebhook(`${body} `, sig, date, '/api/webhooks/powens')).toBe(false);
    expect(verifyPowensWebhook(body, 'short', date, '/api/webhooks/powens')).toBe(false);
    vi.stubEnv('POWENS_WEBHOOK_SECRET', '');
    expect(verifyPowensWebhook(body, sig, date, '/api/webhooks/powens')).toBe(false);
  });
});

describe('saltedge', () => {
  beforeEach(() => {
    vi.stubEnv('SALTEDGE_APP_ID', 'app');
    vi.stubEnv('SALTEDGE_SECRET', 'sec');
    vi.stubEnv('SALTEDGE_PRIVATE_KEY', '');
  });

  it('creates the customer, tolerates a duplicate, carries state on return_to', async () => {
    let connect: { data: { customer_identifier: string; attempt: { return_to: string } } } | undefined;
    const f = mockFetch((url, init) => {
      if (url.endsWith('/customers')) return json({ error: { class: 'DuplicatedCustomer' } }, 409);
      connect = JSON.parse(String(init?.body));
      return { data: { connect_url: 'https://se.test/widget' } };
    });
    const out = await saltedge.initiateConnection('u1', 'https://app.test/cb', 'ST');
    expect(out.redirectUrl).toBe('https://se.test/widget');
    expect(String(f.mock.calls[1][0])).toBe('https://www.saltedge.com/api/v6/connections/connect');
    expect(connect?.data.customer_identifier).toBe('u1');
    expect(new URL(connect!.data.attempt.return_to).searchParams.get('state')).toBe('ST');
  });

  it('refuses a connection id belonging to someone else or an unsealed owner', async () => {
    const sig = seal('saltedge|u1');
    mockFetch(() => ({ data: { customer_identifier: 'other' } }));
    await expect(saltedge.handleCallback({ connection_id: 'c', owner: 'u1', sig })).rejects.toThrow('otherCustomer');
    await expect(saltedge.handleCallback({ connection_id: 'c', owner: 'u2', sig })).rejects.toThrow('unauthenticatedReturn');
    mockFetch(() => ({ data: { customer_identifier: 'u1' } }));
    await expect(saltedge.handleCallback({ connection_id: 'c', owner: 'u1', sig })).resolves.toEqual({ externalId: 'c', accessToken: 'c' });
  });

  it('maps debts, follows pagination, surfaces outages', async () => {
    mockFetch((url) => {
      if (url.includes('/accounts')) {
        return { data: [
          { id: 'a', name: 'Courant', nature: 'checking', balance: 10, currency_code: 'EUR' },
          { id: 'b', name: 'Prêt', nature: 'mortgage', balance: -200, currency_code: 'EUR' },
        ], meta: {} };
      }
      if (url.includes('from_id=n2')) return { data: [{ id: 't2', account_id: 'a', amount: 5, currency_code: 'EUR', made_on: '2026-10-02', description: 'y', mode: 'normal' }], meta: {} };
      return { data: [{ id: 't1', account_id: 'a', amount: -1, currency_code: 'EUR', made_on: '2026-10-01', description: 'x', mode: 'fee' }], meta: { next_id: 'n2' } };
    });
    const out = await saltedge.sync({ accessToken: 'conn' });
    expect(out.accounts[1]).toMatchObject({ type: 'loan', balance: 200 });
    expect(out.transactions.map((t) => t.type)).toEqual(['fee', 'deposit']);
    mockFetch(() => json('down', 503));
    await expect(saltedge.sync({ accessToken: 'conn' })).rejects.toThrow('503');
  });

  it('verifies the RSA signature over callback_url|post_body', () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const sig = createSign('RSA-SHA256').update('https://app.test/hook|{"a":1}').sign(privateKey, 'base64');
    expect(verifySaltEdgeWebhook('{"a":1}', sig, 'https://app.test/hook', pem)).toBe(true);
    expect(verifySaltEdgeWebhook('{"a":2}', sig, 'https://app.test/hook', pem)).toBe(false);
    expect(verifySaltEdgeWebhook('{"a":1}', sig, 'https://evil.test/hook', pem)).toBe(false);
    expect(verifySaltEdgeWebhook('{"a":1}', sig, 'https://app.test/hook')).toBe(false);
  });
});

describe('lean', () => {
  beforeEach(() => {
    vi.stubEnv('LEAN_APP_TOKEN', 'app');
    vi.stubEnv('LEAN_CLIENT_ID', 'id');
    vi.stubEnv('LEAN_CLIENT_SECRET', 'sec');
    vi.stubEnv('LEAN_BASE_URL', 'https://sandbox.leantech.me');
  });

  it('creates a customer and redirects to our sealed SDK page', async () => {
    mockFetch((url) => (url.includes('oauth2/token') ? { access_token: 'tok' } : { customer_id: 'cust', app_user_id: 'x' }));
    const out = await lean.initiateConnection('u1', 'https://app.test/api/connections/callback', 'STATE-VALUE-123');
    const url = new URL(out.redirectUrl!);
    expect(url.origin + url.pathname).toBe('https://app.test/api/webhooks/lean/link');
    expect(url.searchParams.get('customer_id')).toBe('cust');
    expect(out.connectionId).toBe('cust');
  });

  it('accepts only a sealed customer id on return', async () => {
    const { success } = lean.returnUrls('cust', 'ST', 'https://app.test/cb');
    const params = Object.fromEntries(new URL(success).searchParams);
    expect(params.state).toBe('ST');
    await expect(lean.handleCallback(params)).resolves.toEqual({ externalId: 'cust', accessToken: 'cust' });
    await expect(lean.handleCallback({ ...params, customer_id: 'other' })).rejects.toThrow('unauthenticatedReturn');
  });

  it('reads the documented account, balance and transaction shapes', async () => {
    mockFetch((url) => {
      if (url.includes('oauth2/token')) return { access_token: 'tok' };
      if (url.includes('/entities')) return [{ id: 'e1', bank_identifier: 'ENBD_UAE' }];
      if (url.includes('/balances')) {
        return { status: 'OK', data: { balances: [
          { type: 'OPENING_BOOKED', amount: { amount: 1, currency: 'AED' } },
          { type: 'INTERIM_AVAILABLE', credit_debit_indicator: 'CREDIT', amount: { amount: 1234.5, currency: 'AED' } },
        ] } };
      }
      if (url.includes('/transactions')) {
        return { status: 'OK', data: { page: { number: 0, total_pages: 1 }, transactions: [
          { transaction_id: 't', credit_debit_indicator: 'DEBIT', amount: { amount: 20, currency: 'AED' }, booking_date_time: '2026-10-01T00:00:00Z', transaction_information: 'Café' },
        ] } };
      }
      return { status: 'OK', data: { accounts: [{ account_id: 'a1', account_holder_name: 'A', currency: 'AED' }] } };
    });
    const out = await lean.sync({ accessToken: 'cust' });
    expect(out.accounts[0]).toMatchObject({ externalId: 'a1', institution: 'ENBD_UAE', balance: 1234.5, currency: 'AED' });
    expect(out.transactions[0]).toMatchObject({ amount: -20, type: 'withdrawal' });
  });

  it('turns an expired consent into an error', async () => {
    mockFetch((url) => {
      if (url.includes('oauth2/token')) return { access_token: 'tok' };
      if (url.includes('/entities')) return [{ id: 'e1' }];
      return { status: 'CONSENT_EXPIRED', data: {} };
    });
    await expect(lean.sync({ accessToken: 'cust' })).rejects.toThrow('consentExpired');
  });

  it('verifies sha512= HMAC signatures', () => {
    vi.stubEnv('LEAN_WEBHOOK_SECRET', 'whsec');
    const body = '{"type":"entity.created"}';
    const good = `sha512=${createHmac('sha512', 'whsec').update(body).digest('hex')}`;
    expect(verifyLeanWebhook(body, good)).toBe(true);
    expect(verifyLeanWebhook(`${body} `, good)).toBe(false);
    vi.stubEnv('LEAN_WEBHOOK_SECRET', '');
    expect(verifyLeanWebhook(body, good)).toBe(false);
  });
});

describe('binance', () => {
  it('signs the request, values assets, survives an asset with no USDT pair', async () => {
    const f = mockFetch((url) => {
      if (url.includes('/account')) {
        return { balances: [
          { asset: 'BTC', free: '0.5', locked: '0.5' },
          { asset: 'USDT', free: '100', locked: '0' },
          { asset: 'LDETH', free: '1', locked: '0' },
          { asset: 'OBSCURE', free: '7', locked: '0' },
          { asset: 'ZERO', free: '0', locked: '0' },
        ] };
      }
      return [{ symbol: 'BTCUSDT', price: '60000' }, { symbol: 'ETHUSDT', price: '3000' }];
    });
    const out = await binance.sync({ accessToken: 'key', apiSecret: 'secret' });
    expect(out.accounts[0].balance).toBe(63100);
    expect(out.holdings.map((h) => h.symbol)).toEqual(['BTC', 'USDT', 'LDETH', 'OBSCURE']);
    expect(out.holdings.every((h) => h.accountExternalId === 'binance-spot')).toBe(true);
    expect(out.holdings[3].currentPrice).toBe(0);
    const signed = new URL(String(f.mock.calls[0][0]));
    const sig = signed.searchParams.get('signature');
    signed.searchParams.delete('signature');
    expect(sig).toBe(createHmac('sha256', 'secret').update(signed.search.slice(1)).digest('hex'));
    expect((f.mock.calls[0][1]?.headers as Record<string, string>)['X-MBX-APIKEY']).toBe('key');
  });

  it('reports refused keys', async () => {
    mockFetch(() => json({ code: -2015, msg: 'Invalid API-key' }, 401));
    await expect(binance.sync({ accessToken: 'k', apiSecret: 's' })).rejects.toThrow('401');
    await expect(binance.sync({ accessToken: 'k' })).rejects.toThrow('binanceKeysRequired');
  });
});

describe('ibkr flex', () => {
  const STATEMENT = `<FlexQueryResponse queryName="q" type="AF"><FlexStatements count="1">
    <FlexStatement accountId="U123" fromDate="20261030" toDate="20261030">
      <AccountInformation accountId="U123" currency="EUR" name="A B" />
      <EquitySummaryInBase><EquitySummaryByReportDateInBase reportDate="20261029" total="900" /><EquitySummaryByReportDateInBase reportDate="20261030" total="1000.5" /></EquitySummaryInBase>
      <OpenPositions><OpenPosition symbol="AAPL" conid="265598" description="APPLE &amp; CO" position="3" markPrice="200" positionValue="600" costBasisPrice="150" currency="USD" assetCategory="STK" fxRateToBase="0.9" levelOfDetail="SUMMARY" /></OpenPositions>
    </FlexStatement></FlexStatements></FlexQueryResponse>`;

  it('parses a statement', () => {
    const out = parseFlexStatement(STATEMENT);
    expect(out.accounts[0]).toMatchObject({ externalId: 'U123', balance: 1000.5, currency: 'EUR', type: 'brokerage' });
    expect(out.holdings[0]).toMatchObject({ accountExternalId: 'U123', symbol: 'AAPL', name: 'APPLE & CO', assetClass: 'stocks', avgPrice: 150 });
  });

  it('polls through "in progress", then fails on a real error', async () => {
    vi.stubEnv('IBKR_FLEX_WAIT_MS', '0');
    let polls = 0;
    const f = mockFetch((url) => {
      if (url.includes('SendRequest')) return json('<FlexStatementResponse><Status>Success</Status><ReferenceCode>R1</ReferenceCode></FlexStatementResponse>');
      polls += 1;
      return json(polls === 1 ? '<FlexStatementResponse><Status>Warn</Status><ErrorCode>1019</ErrorCode></FlexStatementResponse>' : STATEMENT);
    });
    const out = await ibkr.sync({ accessToken: 'tok', apiSecret: '99' });
    expect(out.accounts).toHaveLength(1);
    expect(polls).toBe(2);
    expect((f.mock.calls[0][1]?.headers as Record<string, string>)['User-Agent']).toBeTruthy();
    mockFetch(() => json("<FlexStatementResponse><Status>Fail</Status><ErrorCode>1015</ErrorCode></FlexStatementResponse>"));
    await expect(ibkr.sync({ accessToken: 'tok', apiSecret: '99' })).rejects.toThrow('1015');
  });
});
