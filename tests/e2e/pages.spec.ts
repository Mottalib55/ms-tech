import { expect, test } from '@playwright/test';
import { addAccount, register, startDemo, uniqueEmail, PASSWORD, watchErrors } from './helpers';

test('démo : chiffres cohérents et sélecteurs de période réels', async ({ page }) => {
  const errors = watchErrors(page);
  await startDemo(page);
  await expect(page.getByText(/Mode démo/)).toBeVisible();
  // The net is the sum shown beside it, and allocation adds up to 100 %.
  const summary = await (await page.request.get('/api/summary')).json();
  expect(Math.abs(summary.assets - summary.debts - summary.netWorth)).toBeLessThan(0.01);
  const total = summary.allocation.reduce((s: number, a: { percent: number }) => s + a.percent, 0);
  expect(Math.abs(total - 100)).toBeLessThan(0.6);
  await expect(page.locator('body')).not.toContainText(/\d{4,}\s?%/);

  const gain = page.getByTestId('period-gain');
  await expect(gain).toBeVisible();
  const seen = new Set<string>();
  for (const p of ['1M', '3M', '6M', '1A', '5A']) {
    await page.getByRole('radio', { name: p, exact: true }).click();
    await expect(page.getByRole('radio', { name: p, exact: true })).toHaveAttribute('aria-checked', 'true');
    seen.add(await gain.innerText());
  }
  expect(seen.size).toBeGreaterThan(2);

  await page.getByRole('radio', { name: 'Tableau' }).first().click();
  await expect(page.getByRole('columnheader', { name: 'Patrimoine net' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('depuis la démo, « Créer mon compte » mène à un vrai compte, vide', async ({ page }) => {
  await startDemo(page);
  await page.getByRole('link', { name: 'Créer mon compte' }).click();
  await page.waitForURL('**/register');
  await page.getByLabel('Nom').fill('Ex Démo');
  await page.getByLabel('Email').fill(uniqueEmail());
  await page.getByLabel('Mot de passe', { exact: false }).first().fill(PASSWORD);
  await page.getByRole('button', { name: /créer mon compte/i }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByText(/premier compte/i)).toBeVisible();
  await expect(page.getByText(/Mode démo/)).toHaveCount(0);
});

test('recherche et notifications fonctionnent', async ({ page }) => {
  await startDemo(page);
  await page.getByRole('button', { name: /^Rechercher/ }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox').fill('livret');
  await dialog.getByRole('button', { name: /Livret A/ }).click();
  await page.waitForURL(/accounts\/.+/);
  await expect(page.getByRole('heading', { name: 'Livret A' })).toBeVisible();

  await page.getByRole('button', { name: /Notifications/ }).click();
  await expect(page.getByRole('dialog').getByRole('link').first()).toBeVisible();
  await page.getByRole('dialog').getByRole('link').first().click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('paramètres : profil et devise persistent, mot de passe changé, données exportées, compte supprimé', async ({ page, context }) => {
  const errors = watchErrors(page);
  const email = await register(page, uniqueEmail());
  await addAccount(page, { name: 'Mon livret', balance: '1000' });
  await page.goto('/dashboard/settings');

  await page.getByLabel('Nom', { exact: true }).fill('Nouveau Nom');
  await page.getByRole('button', { name: 'Enregistrer' }).first().click();
  await expect(page.getByText('Profil enregistré')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Nom', { exact: true })).toHaveValue('Nouveau Nom');

  await page.getByLabel("Devise d'affichage").selectOption('USD');
  await page.getByRole('button', { name: 'Enregistrer' }).nth(1).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Changer de devise' }).click();
  await expect(page.getByText('Devise modifiée')).toBeVisible();
  await page.goto('/dashboard');
  await expect(page.getByTestId('net-worth')).toContainText('$');
  await page.goto('/dashboard/settings');

  await page.getByLabel('Mot de passe actuel', { exact: true }).fill('mauvais');
  await page.getByLabel('Nouveau mot de passe').fill('un-nouveau-secret-9');
  await page.getByRole('button', { name: /changer le mot de passe/i }).click();
  await expect(page.getByText(/incorrect/i).first()).toBeVisible();
  await page.getByLabel('Mot de passe actuel', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: /changer le mot de passe/i }).click();
  await expect(page.getByText(/mot de passe (modifié|changé|mis à jour)/i).first()).toBeVisible();
  await page.goto('/dashboard/accounts');
  await expect(page.getByText('Mon livret')).toBeVisible();

  const exported = await page.request.get('/api/me/export');
  expect(exported.status()).toBe(200);
  const body = await exported.text();
  expect(body).toContain('Mon livret');
  expect(body).not.toMatch(/passwordHash|accessTokenEnc|apiSecretEnc/);

  await page.goto('/dashboard/settings');
  await page.getByRole('button', { name: /supprimer mon compte/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/mot de passe/i).fill('un-nouveau-secret-9');
  await dialog.getByRole('button', { name: /supprimer/i }).click();
  await page.waitForURL(/\/(login)?(\?.*)?$/);

  await context.clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('un-nouveau-secret-9');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page.getByRole('alert').filter({ hasText: /incorrect/i })).toBeVisible();
  expect(errors).toEqual([]);
});

test('changer de mot de passe déconnecte les autres appareils', async ({ page, browser, baseURL }) => {
  const email = await register(page);
  const other = await browser.newContext({ baseURL });
  const device = await other.newPage();
  await device.goto('/login');
  await device.getByLabel('Email').fill(email);
  await device.getByLabel('Mot de passe', { exact: false }).first().fill(PASSWORD);
  await device.getByRole('button', { name: /se connecter/i }).click();
  await device.waitForURL('**/dashboard');
  expect((await page.request.post('/api/me/password', { data: { currentPassword: PASSWORD, newPassword: 'secret-tout-neuf-1' } })).status()).toBe(200);
  expect((await device.request.get('/api/accounts')).status()).toBe(401);
  await other.close();
});

test('frais, dividendes et budget : ajouter puis retirer', async ({ page }) => {
  const errors = watchErrors(page);
  await register(page);
  await addAccount(page, { name: 'CTO', balance: '5000', type: 'brokerage' });
  const accounts = await (await page.request.get('/api/accounts')).json();
  await page.request.post('/api/holdings', { data: { accountId: accounts[0].id, symbol: 'SAN', name: 'Sanofi', quantity: 10, avgPrice: 80, currentPrice: 90, assetClass: 'stocks' } });

  await page.goto('/dashboard/fees');
  await page.getByRole('button', { name: /ajouter/i }).first().click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Libellé', { exact: false }).fill('Frais de test');
  await dialog.getByLabel(/montant/i).fill('120');
  await dialog.getByLabel(/pourcentage|taux/i).first().fill('1');
  await dialog.getByRole('button', { name: /ajouter|enregistrer/i }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Frais de test')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/NaN|Infinity|undefined/);
  await page.getByRole('button', { name: /supprimer/i }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: /supprimer/i }).click();
  await expect(page.getByText('Frais de test')).toHaveCount(0);

  await page.goto('/dashboard/dividends');
  await page.getByRole('button', { name: /ajouter/i }).first().click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Position')).toHaveValue(/.+/);
  await dialog.getByLabel('Montant total').fill('33');
  await dialog.getByLabel('Détachement').fill('2026-03-01');
  await dialog.getByLabel('Paiement').fill('2026-03-10');
  await dialog.getByRole('button', { name: /ajouter|enregistrer/i }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('SAN', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /supprimer/i }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: /supprimer/i }).click();
  await expect(page.getByText('SAN', { exact: true })).toHaveCount(0);

  const month = new Date().toISOString().slice(0, 7);
  expect((await page.request.post('/api/budget', { data: { month, income: 3000, categories: [{ name: 'Courses', icon: 'tag', color: '#5b86f0', budgeted: 400, spent: 500 }] } })).status()).toBe(200);
  await page.goto('/dashboard/budget');
  await expect(page.getByText('Courses').first()).toBeVisible();
  await expect(page.locator('body')).toContainText('2 500');
  await expect(page.locator('body')).not.toContainText(/NaN|Infinity|undefined/);
  await page.getByRole('radio', { name: 'Annuel' }).click();
  await expect(page.locator('body')).not.toContainText(/NaN|Infinity|undefined/);
  await page.getByRole('button', { name: /notifications : 1/i }).click();
  await expect(page.getByRole('dialog')).toContainText('Budget dépassé : Courses');
  expect(errors).toEqual([]);
});

test('simulateurs et projections : les valeurs extrêmes ne cassent rien', async ({ page }) => {
  const errors = watchErrors(page);
  await startDemo(page);
  await page.goto('/dashboard/simulators');
  for (const tab of await page.getByRole('tab').all()) {
    await tab.click();
    for (const input of await page.locator('main input').all()) {
      await input.fill('');
      await expect(page.locator('main')).not.toContainText(/NaN|Infinity/);
      await input.fill('0');
      await expect(page.locator('main')).not.toContainText(/NaN|Infinity/);
      await input.fill('99999999');
      await expect(page.locator('main')).not.toContainText(/NaN|Infinity/);
    }
  }
  // Réinitialiser restores the value that was changed.
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  const first = page.locator('main input').first();
  const initial = await first.inputValue();
  await first.fill('12345');
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(first).toHaveValue(initial);

  await page.goto('/dashboard/predict');
  await page.getByLabel('Âge cible').fill('20');
  await page.getByLabel('Âge actuel').fill('60');
  await expect(page.locator('main')).toContainText(/supérieur|après|cible/i);
  await page.getByRole('button', { name: /réinitialiser/i }).click();
  await expect(page.locator('main')).not.toContainText(/NaN|Infinity/);
  expect(errors).toEqual([]);
});

test('pages publiques : aucun lien mort et aucun chiffre inventé', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText(/15[\s  ]?000|2[.,]5 Mrd|99[.,]9|milliers d.investisseurs|bout en bout/);
  const hrefs = await page.locator('a[href]').evaluateAll((a) => a.map((x) => x.getAttribute('href')!));
  expect(hrefs).not.toContain('#');
  for (const href of new Set(hrefs.filter((h) => h.startsWith('/')))) {
    expect((await request.get(href)).status(), href).toBeLessThan(400);
  }
  expect((await request.get('/page-inexistante')).status()).toBe(404);
});
