import { expect, test, type Page } from '@playwright/test';
import { PASSWORD, register, uniqueEmail, watchErrors } from './helpers';

const PAGES = ['/dashboard', '/dashboard/accounts', '/dashboard/portfolio', '/dashboard/connections', '/dashboard/budget', '/dashboard/dividends', '/dashboard/fees', '/dashboard/predict', '/dashboard/simulators', '/dashboard/settings'];
const PUBLIC = ['', '/login', '/register', '/forgot', '/legal/terms', '/legal/privacy'];

// Whole words a translated page must not contain. French product names (PEA, CTO) are not listed.
const FRENCH = /\b(Compte|Comptes|Ajouter|Patrimoine|Frais|Réessayer|Annuler|Enregistrer|Supprimer|Connexion|Déconnexion|Paramètres|Mot de passe|Vous|Votre|Vos|Aucun|Aucune|Mon|Mes|Pour|Avec)\b/;

async function demo(page: Page, locale: string) {
  await page.goto(`/${locale}`);
  await page.locator('[data-testid="demo-button"], button:has-text("demo"), button:has-text("التجريبية")').first().click();
  await page.waitForURL(`**/${locale}/dashboard`, { timeout: 30_000 });
  await expect(page.getByTestId('net-worth')).toBeVisible();
}

const visibleText = (page: Page) => page.locator('body').innerText();

test.describe('language routing', () => {
  test('an address without a language follows the device', async ({ browser }) => {
    for (const [device, expected] of [['fr-FR', 'fr'], ['en-US', 'en'], ['ar-AE', 'ar'], ['de-DE', 'en']] as const) {
      const ctx = await browser.newContext({ locale: device, baseURL: 'http://localhost:3100' });
      const page = await ctx.newPage();
      await page.goto('/login');
      await expect(page).toHaveURL(new RegExp(`/${expected}/login`));
      await ctx.close();
    }
  });

  test('Arabic is right to left, the others left to right', async ({ page }) => {
    await page.goto('/ar/login');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await page.goto('/en/login');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('unknown address gives the 404 of that language', async ({ page }) => {
    const res = await page.goto('/en/nothing-here');
    expect(res?.status()).toBe(404);
    expect(FRENCH.test(await visibleText(page))).toBe(false);
  });

  test('signed out, the dashboard redirects to the login of the same language', async ({ page }) => {
    await page.goto('/ar/dashboard/fees');
    await expect(page).toHaveURL(/\/ar\/login\?callbackUrl=%2Far%2Fdashboard%2Ffees/);
  });

  test('the app opens on the login, the website on its home page', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'en-US', baseURL: 'http://localhost:3100', userAgent: 'Mozilla/5.0 (iPhone) MSTechApp/1' });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/\/en\/login$/);
    await ctx.close();
    const web = await browser.newContext({ locale: 'en-US', baseURL: 'http://localhost:3100' });
    const w = await web.newPage();
    await w.goto('/');
    await expect(w).toHaveURL(/\/en$/);
    await web.close();
  });
});

for (const locale of ['en', 'ar'] as const) {
  test.describe(`${locale}: nothing left in French`, () => {
    test('public pages', async ({ page }) => {
      const errors = watchErrors(page);
      for (const path of PUBLIC) {
        await page.goto(`/${locale}${path}`);
        const hit = (await visibleText(page)).match(FRENCH);
        expect(hit?.[0], `${path}`).toBeUndefined();
      }
      expect(errors).toEqual([]);
    });

    test('every app page, without overflow', async ({ page }) => {
      const errors = watchErrors(page);
      await demo(page, locale);
      for (const path of PAGES) {
        await page.goto(`/${locale}${path}`);
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
        const hit = (await visibleText(page)).match(FRENCH);
        expect(hit?.[0], `${path}`).toBeUndefined();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path}`).toBeLessThanOrEqual(0);
      }
      expect(errors).toEqual([]);
    });
  });
}

test('server errors come back in the language of the page', async ({ page, baseURL }) => {
  await page.goto('/ar/login');
  const res = await page.request.get(`${baseURL}/api/me`);
  expect(res.status()).toBe(401);
  expect((await res.json()).error).toMatch(/[؀-ۿ]/);
  await page.goto('/en/login');
  expect((await (await page.request.get(`${baseURL}/api/me`)).json()).error).toBe('Session expired');
});

test('the language chosen is kept, on the same page', async ({ page }) => {
  await page.goto('/en/login');
  await page.getByLabel('Language').selectOption('ar');
  await page.waitForURL('**/ar/login');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.goto('/login');
  await expect(page).toHaveURL(/\/ar\/login/);
});

test.describe('themes', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`follows the device: ${scheme}`, async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme: scheme, baseURL: 'http://localhost:3100', locale: 'en-US' });
      const page = await ctx.newPage();
      await page.goto('/en/login');
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe(scheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(11, 11, 12)');
      await ctx.close();
    });
  }

  test('a theme chosen in settings survives a reload', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'light', baseURL: 'http://localhost:3100', locale: 'en-US' });
    const page = await ctx.newPage();
    await demo(page, 'en');
    await page.goto('/en/dashboard/settings');
    await page.getByRole('radio', { name: 'Dark' }).click();
    await page.reload();
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(11, 11, 12)');
    await ctx.close();
  });
});

test.describe('sign in with an e-mail code', () => {
  async function ask(page: Page, email: string) {
    await page.goto('/en/login');
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Send the code' }).click();
    await expect(page.getByLabel('6-digit code')).toBeVisible();
    return page.evaluate(() => document.documentElement.dataset.devCode ?? '');
  }

  test('the right code opens the same account as the password', async ({ page, context }) => {
    const email = await register(page, uniqueEmail());
    await page.goto('about:blank');
    await context.clearCookies();
    const code = await ask(page, email);
    expect(code).toMatch(/^\d{6}$/);
    await page.getByLabel('6-digit code').fill(code);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/dashboard$/);
    await page.goto('/en/dashboard/settings');
    await expect(page.getByText(email).or(page.locator(`input[value="${email}"]`)).first()).toBeVisible();
  });

  test('a code only works once, and a wrong one is refused', async ({ page, context }) => {
    const email = await register(page, uniqueEmail());
    await page.goto('about:blank');
    await context.clearCookies();
    const code = await ask(page, email);
    await page.getByLabel('6-digit code').fill(code === '000000' ? '000001' : '000000');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('main').getByRole('alert')).toContainText('Incorrect or expired code');
    await page.getByLabel('6-digit code').fill(code);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/dashboard$/);
    await page.goto('about:blank');
    await context.clearCookies();
    await page.goto('/en/login');
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Send the code' }).click();
    await page.getByLabel('6-digit code').fill(code);
    await page.getByRole('button', { name: 'Sign in' }).click();
    // A new code was issued meanwhile; the old one must not match it (1 in a million otherwise).
    await expect(page.locator('main').getByRole('alert')).toContainText('Incorrect or expired code');
  });

  test('an unknown address gets the same screen and no code', async ({ page }) => {
    expect(await ask(page, uniqueEmail())).toBe('');
  });

  test('a password still works alongside', async ({ page, context }) => {
    const email = await register(page, uniqueEmail());
    await page.goto('about:blank');
    await context.clearCookies();
    await page.goto('/en/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/dashboard$/);
  });
});

test('Apple universal links file answers only once configured', async ({ request }) => {
  const res = await request.get('/.well-known/apple-app-site-association');
  expect(res.status()).toBe(404);
});
