import { expect, test } from '@playwright/test';
import { netWorth, register, watchErrors } from './helpers';

async function connectSandbox(page: import('@playwright/test').Page) {
  await page.goto('/dashboard/connections');
  await page.getByRole('button', { name: 'Connecter', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: /Banque de démonstration/ }).click();
  await page.waitForURL('**/connect/sandbox**');
}

test('connecter, synchroniser sans doublon, puis déconnecter une banque', async ({ page }) => {
  const errors = watchErrors(page);
  await register(page);
  await connectSandbox(page);
  await page.getByRole('button', { name: /autoriser/i }).click();
  await page.waitForURL('**/dashboard/connections**');
  await expect(page.getByText('Banque de démonstration connecté')).toBeVisible();
  await expect(page).toHaveURL(/connections$/);
  await expect(page.getByText('Actif')).toBeVisible();
  await expect(page.getByText(/2 comptes/)).toBeVisible();

  // Comptes, patrimoine et positions arrivent bien, positions sur le BON compte.
  expect(await netWorth(page)).toBe('21491€');
  await page.goto('/dashboard/accounts');
  await expect(page.getByText('Compte courant')).toBeVisible();
  await expect(page.getByText('2 positions')).toBeVisible();
  const custody = async () => (await (await page.request.get('/api/fees')).json()).filter((f: { label: string }) => f.label === 'Droits de garde').length;
  expect(await custody()).toBe(1);

  await page.goto('/dashboard/connections');
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Synchroniser' }).click();
    await expect(page.getByText('Banque de démonstration synchronisé').first()).toBeVisible();
  }
  expect(await custody()).toBe(1);
  expect(await netWorth(page)).toBe('21491€');

  await page.goto('/dashboard/connections');
  await page.getByRole('button', { name: 'Déconnecter', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Déconnecter', exact: true }).click();
  await expect(page.getByText('Aucune connexion')).toBeVisible();
  await page.goto('/dashboard');
  await expect(page.getByText(/premier compte/i)).toBeVisible();
  expect(errors).toEqual([]);
});

test('refuser l\'accès à la banque ne laisse aucune connexion', async ({ page }) => {
  await register(page);
  await connectSandbox(page);
  await page.getByRole('button', { name: 'Refuser' }).click();
  await page.waitForURL('**/dashboard/connections**');
  await expect(page.getByText(/refusé l.accès/)).toBeVisible();
  await expect(page.getByText('Aucune connexion')).toBeVisible();
});

test('un retour de banque forgé ou rejoué est rejeté', async ({ page }) => {
  await register(page);
  await page.goto('/api/connections/callback?state=forge&code=x');
  await page.waitForURL('**/dashboard/connections**');
  await expect(page.getByText(/expiré/)).toBeVisible();
  await expect(page.getByText('Aucune connexion')).toBeVisible();
});

test('abandonner l\'écran de la banque ne laisse pas de connexion fantôme', async ({ page }) => {
  await register(page);
  await connectSandbox(page);
  await page.goto('/dashboard/connections');
  await expect(page.getByText('Aucune connexion')).toBeVisible();
});

test('un fournisseur sans clés est signalé, jamais une erreur au clic', async ({ page }) => {
  await register(page);
  await page.goto('/dashboard/connections');
  await page.getByRole('button', { name: 'Connecter', exact: true }).first().click();
  const powens = page.getByRole('dialog').getByRole('button', { name: /Powens/ });
  await expect(powens).toBeDisabled();
  await expect(powens).toContainText('Bientôt disponible');
});

test('des clés Binance refusées sont expliquées et rien n\'est conservé', async ({ page }) => {
  await register(page);
  await page.goto('/dashboard/connections');
  await page.getByRole('button', { name: 'Connecter', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Binance/ }).click();
  await dialog.getByLabel('Clé API').fill('cle-invalide-1234567890');
  await dialog.getByLabel('Secret API').fill('secret-invalide-1234567890');
  await dialog.getByRole('button', { name: 'Connecter Binance' }).click();
  await expect(dialog.getByRole('alert')).toContainText(/refusé ces clés/, { timeout: 25_000 });
  await page.keyboard.press('Escape');
  await expect(page.getByText('Aucune connexion')).toBeVisible();
});

test('Interactive Brokers se connecte par jeton : un jeton refusé est expliqué et rien n\'est conservé', async ({ page }) => {
  await register(page);
  await page.goto('/dashboard/connections');
  await page.getByRole('button', { name: 'Connecter', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Interactive Brokers/ }).click();
  await dialog.getByLabel('Jeton Flex').fill('jeton-invalide-1234567890');
  await dialog.getByLabel('Numéro de la requête Flex').fill('123456');
  await dialog.getByRole('button', { name: /Connecter Interactive Brokers/ }).click();
  await expect(dialog.getByRole('alert')).toContainText(/refusé ces identifiants/, { timeout: 40_000 });
  await page.keyboard.press('Escape');
  await expect(page.getByText('Aucune connexion')).toBeVisible();
});
