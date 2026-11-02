import { expect, test } from '@playwright/test';
import { PASSWORD, register, uniqueEmail, watchErrors } from './helpers';

test('un visiteur non connecté est renvoyé vers la connexion', async ({ page }) => {
  await page.goto('/dashboard/portfolio');
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Ffr%2Fdashboard%2Fportfolio/);
});

test('le formulaire de connexion est vide au départ', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel(/^e-?mail/i)).toHaveValue('');
  await expect(page.getByLabel('Mot de passe', { exact: false }).first()).toHaveValue('');
});

test('inscription, déconnexion, mauvais mot de passe, reconnexion et retour à la page demandée', async ({ page, isMobile }) => {
  const errors = watchErrors(page);
  const email = await register(page);
  if (isMobile) {
    await page.getByRole('button', { name: 'Plus' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Déconnexion' }).click();
  } else {
    await page.getByRole('button', { name: 'Déconnexion' }).click();
  }
  await page.waitForURL('**/login**');

  await page.goto('/dashboard/budget');
  await page.getByLabel(/^e-?mail/i).fill(email);
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('faux-mot-de-passe');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page.getByRole('alert').filter({ hasText: /incorrect/i })).toBeVisible();

  await page.getByLabel('Mot de passe', { exact: false }).first().fill(PASSWORD);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL('**/dashboard/budget');
  expect(errors).toEqual([]);
});

test('un compte connecté ne revoit pas la page de connexion', async ({ page }) => {
  await register(page);
  await page.goto('/login');
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('email déjà pris et mot de passe trop court sont expliqués', async ({ page, context }) => {
  const email = await register(page);
  await page.goto('about:blank'); // leave the dashboard before its session disappears
  await context.clearCookies();
  await page.goto('/register');
  await page.getByLabel('Nom').fill('Autre');
  await page.getByLabel(/^e-?mail/i).fill(email);
  await page.getByLabel('Mot de passe', { exact: false }).first().fill(PASSWORD);
  await page.getByRole('button', { name: /créer mon compte/i }).click();
  await expect(page.getByRole('alert').filter({ hasText: /existe déjà/i })).toBeVisible();
  await page.getByLabel(/^e-?mail/i).fill(uniqueEmail());
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('court');
  await page.getByRole('button', { name: /créer mon compte/i }).click();
  await expect(page.getByRole('alert').filter({ hasText: /8 caractères/i })).toBeVisible();
});

test('mot de passe oublié : le lien change le mot de passe et ne sert qu\'une fois', async ({ page, context, request }) => {
  const email = await register(page);
  await page.goto('about:blank'); // leave the dashboard before its session disappears
  await context.clearCookies();
  const res = await request.post('/api/auth/forgot', { data: { email } });
  const { devToken } = await res.json();
  expect(devToken).toBeTruthy();
  const unknown = await request.post('/api/auth/forgot', { data: { email: uniqueEmail() } });
  expect((await unknown.json()).devToken).toBeUndefined();

  await page.goto(`/reset?token=${devToken}`);
  await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('nouveau-mot-de-passe-2');
  await page.getByLabel('Confirmez-le').fill('autre-chose-qui-differe');
  await page.getByRole('button', { name: 'Changer le mot de passe' }).click();
  await expect(page.getByRole('alert').filter({ hasText: /correspondent pas/ })).toBeVisible();
  await page.getByLabel('Confirmez-le').fill('nouveau-mot-de-passe-2');
  await page.getByRole('button', { name: 'Changer le mot de passe' }).click();
  await page.waitForURL('**/login**');
  await page.getByLabel(/^e-?mail/i).fill(email);
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('nouveau-mot-de-passe-2');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

  const again = await request.post('/api/auth/reset', { data: { token: devToken, password: 'encore-un-autre-3' } });
  expect(again.status()).toBe(400);
});
