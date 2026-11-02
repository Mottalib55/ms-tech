import { expect, test } from '@playwright/test';
import { addAccount, register } from './helpers';

const PROTECTED = ['summary', 'accounts', 'holdings', 'fees', 'dividends', 'budget', 'performance', 'alerts', 'me', 'me/export', 'connections'];

test('toute l\'API refuse un visiteur non connecté', async ({ request }) => {
  for (const path of PROTECTED) {
    const res = await request.get(`/api/${path}`);
    expect(res.status(), path).toBe(401);
  }
});

test('un utilisateur ne peut ni lire ni modifier le compte d\'un autre', async ({ page, browser }) => {
  await register(page);
  await addAccount(page, { name: 'Secret de A', balance: '999' });
  const list = await page.request.get('/api/accounts');
  const [{ id }] = await list.json();

  const context = await browser.newContext();
  const other = await context.newPage();
  await register(other);
  const r = other.request;
  expect((await r.get(`/api/accounts/${id}`)).status()).toBe(404);
  expect((await r.patch(`/api/accounts/${id}`, { data: { balance: 1 } })).status()).toBe(404);
  expect((await r.delete(`/api/accounts/${id}`)).status()).toBe(404);
  expect((await r.post('/api/holdings', { data: { accountId: id, symbol: 'X', name: 'X', quantity: 1, avgPrice: 1, currentPrice: 1, assetClass: 'stocks' } })).status()).toBe(404);
  expect((await r.post('/api/transactions', { data: { accountId: id, type: 'deposit', amount: 1, date: '2026-01-01' } })).status()).toBe(404);
  expect(await (await r.get('/api/accounts')).json()).toEqual([]);
  await context.close();
  expect((await (await page.request.get(`/api/accounts/${id}`)).json()).balance).toBe(999);
});

test('le cron refuse sans secret et fonctionne avec', async ({ request }) => {
  expect((await request.get('/api/sync/cron')).status()).toBe(401);
  const ok = await request.get('/api/sync/cron', { headers: { Authorization: 'Bearer e2e-cron' } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toHaveProperty('total');
});

test('les webhooks refusent une signature absente', async ({ request }) => {
  for (const p of ['powens', 'lean', 'saltedge']) {
    expect((await request.post(`/api/webhooks/${p}`, { data: { x: 1 } })).status(), p).toBe(401);
  }
});

test('valeurs absurdes refusées proprement, jamais une erreur 500', async ({ page }) => {
  await register(page);
  const r = page.request;
  for (const data of [{}, { name: '', type: 'bank', balance: 1 }, { name: 'x', type: 'pirate', balance: 1 }, { name: 'x', type: 'bank', balance: 'beaucoup' }, { name: 'x', type: 'bank', balance: 1e30 }]) {
    expect((await r.post('/api/accounts', { data })).status(), JSON.stringify(data)).toBe(400);
  }
  const bad = await r.post('/api/accounts', { data: 'pas du json', headers: { 'Content-Type': 'application/json' } });
  expect(bad.status()).toBe(400);
});

test('du code injecté dans un nom reste du texte', async ({ page }) => {
  await register(page);
  let fired = false;
  page.on('dialog', async (d) => { fired = true; await d.dismiss(); });
  await addAccount(page, { name: '<img src=x onerror=alert(1)>', balance: '10' });
  await page.goto('/dashboard/accounts');
  await page.waitForTimeout(400);
  expect(fired).toBe(false);
});

test('en-têtes de sécurité présents', async ({ request }) => {
  const res = await request.get('/login');
  const h = res.headers();
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
});
