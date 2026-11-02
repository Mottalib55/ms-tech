import { expect, test } from '@playwright/test';
import { startDemo } from './helpers';

// On a slow phone the page hydrates late. Server HTML and first client render must still match.
test('pas d\'erreur d\'hydratation sur un appareil lent', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Le ralentissement CPU passe par Chromium');
  test.setTimeout(180_000);
  await startDemo(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`${page.url()} ${e.message.slice(0, 60)}`));
  for (const route of ['portfolio', 'accounts', 'budget', 'dividends', 'fees', 'connections', 'settings', 'simulators', 'predict', '']) {
    for (let i = 0; i < 2; i++) {
      await page.goto(`/dashboard/${route}`);
      await page.waitForLoadState('networkidle');
    }
  }
  console.log('HYDRATION', JSON.stringify(errors));
  expect(errors).toEqual([]);
});
