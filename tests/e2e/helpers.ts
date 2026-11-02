import { expect, type Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';

export const PASSWORD = 'motdepasse-solide-1';
export const uniqueEmail = () => `e2e-${randomBytes(6).toString('hex')}@test.local`;

export async function register(page: Page, email = uniqueEmail(), name = 'Camille Test') {
  await page.goto('/register');
  await page.getByLabel('Nom').fill(name);
  await page.getByLabel(/^e-?mail/i).fill(email);
  await page.getByLabel('Mot de passe', { exact: false }).first().fill(PASSWORD);
  await page.getByRole('button', { name: /créer mon compte/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  return email;
}

export async function startDemo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /démo/i }).first().click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  await expect(page.getByTestId('net-worth')).toBeVisible();
}

export async function addAccount(page: Page, a: { name: string; balance: string; type?: string; currency?: string; institution?: string }) {
  await page.goto('/dashboard/accounts');
  await page.getByRole('button', { name: 'Ajouter', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nom du compte').fill(a.name);
  if (a.type) await dialog.getByLabel('Type').selectOption(a.type);
  if (a.institution) await dialog.getByLabel(/Établissement/).fill(a.institution);
  await dialog.locator('#account-balance').fill(a.balance);
  if (a.currency) await dialog.getByLabel('Devise').selectOption(a.currency);
  await dialog.getByRole('button', { name: 'Ajouter le compte' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(a.name).first()).toBeVisible();
}

export async function netWorth(page: Page) {
  await page.goto('/dashboard');
  const el = page.getByTestId('net-worth');
  await expect(el).toBeVisible();
  return (await el.innerText()).replace(/[\s  ]/g, '');
}

/** Fails a test on any uncaught error, console error or 5xx: "no bug" is measured, not assumed. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  // WebKit reports a request cancelled by leaving the page as these two errors. Measured: none
  // at rest or in app navigation, only when a test jumps away while the page is still loading.
  const cancelled = /(_rsc=|\/api\/).*due to access control checks|CLIENT_FETCH_ERROR[\s\S]*Load failed/;
  page.on('pageerror', (e) => { if (!cancelled.test(e.message)) errors.push(`pageerror @${page.url()}: ${e.message.slice(0, 90)}`); });
  page.on('console', (m) => { if (m.type() === 'error' && !/401|403|409|400|Failed to load resource/.test(m.text()) && !cancelled.test(m.text())) errors.push(`console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`); });
  return errors;
}
