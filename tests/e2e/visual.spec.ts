import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { startDemo } from './helpers';

// Not an assertion: captures every screen a crawl does not reach, for a human eye.
const DIR = '../ms-tech-captures/apres';
test('captures des pages publiques et des fenêtres', async ({ page }, info) => {
  test.setTimeout(120_000);
  mkdirSync(DIR, { recursive: true });
  const p = info.project.name;
  const shot = (n: string, fullPage = true) => page.screenshot({ path: `${DIR}/${p}-${n}.png`, fullPage });
  for (const [n, u] of [['landing', '/'], ['login', '/login'], ['register', '/register'], ['forgot', '/forgot'], ['mentions', '/legal/mentions'], ['privacy', '/legal/privacy'], ['terms', '/legal/terms'], ['404', '/nope']]) {
    await page.goto(u); await page.waitForLoadState('networkidle'); await shot(n);
  }
  await startDemo(page);
  await page.waitForLoadState('networkidle');
  await page.goto('/dashboard/accounts'); await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Ajouter', exact: true }).first().click(); await page.waitForTimeout(400); await shot('modal-compte', false);
  await page.goto('/dashboard/connections'); await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Connecter', exact: true }).first().click(); await page.waitForTimeout(400); await shot('modal-connexion', false);
  await page.goto('/dashboard/accounts'); await page.waitForLoadState('networkidle');
  await page.locator('main a[href^="/fr/dashboard/accounts/"]').first().click(); await page.waitForURL(/accounts\/.+/); await page.waitForLoadState('networkidle'); await shot('compte-detail');
});
