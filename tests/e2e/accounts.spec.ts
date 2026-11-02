import { expect, test } from '@playwright/test';
import { addAccount, netWorth, register, watchErrors } from './helpers';

test('un nouveau compte ne montre aucune donnée inventée', async ({ page }) => {
  await register(page);
  await expect(page.getByText(/premier compte/i)).toBeVisible();
  for (const path of ['accounts', 'portfolio', 'budget', 'dividends', 'fees', 'connections']) {
    await page.goto(`/dashboard/${path}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText(/Market Securities|Saxo|BNP|396[\s  ]?2/);
  }
});

test('saisie de comptes : le patrimoine net suit, dettes et devises comprises', async ({ page }) => {
  const errors = watchErrors(page);
  await register(page);
  await addAccount(page, { name: 'Livret test', balance: '1 234,50', institution: 'Ma banque' });
  expect(await netWorth(page)).toBe('1235€');

  await addAccount(page, { name: 'Crédit voiture', balance: '500', type: 'loan' });
  expect(await netWorth(page)).toBe('735€');

  // FX_OFFLINE: 1 EUR = 1,08 USD, so 1 080 USD is 1 000 EUR, never 1 080.
  await addAccount(page, { name: 'Compte dollars', balance: '1080', currency: 'USD' });
  expect(await netWorth(page)).toBe('1735€');
  expect(errors).toEqual([]);
});

test('modifier, renommer et supprimer un compte', async ({ page }) => {
  await register(page);
  await addAccount(page, { name: 'À modifier', balance: '100' });
  await page.getByText('À modifier').first().click();
  await page.waitForURL(/accounts\/.+/);
  await page.getByRole('button', { name: 'Modifier' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nom du compte').fill('Modifié');
  await dialog.locator('#account-balance').fill('250,75');
  await dialog.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Modifié' })).toBeVisible();
  await expect(page.getByTestId('account-balance')).toContainText('250,75');
  await page.reload();
  await expect(page.getByTestId('account-balance')).toContainText('250,75');

  await page.getByRole('button', { name: 'Supprimer' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await page.waitForURL(/accounts$/);
  await expect(page.getByText('Modifié')).toHaveCount(0);
  await expect(page.getByText(/Aucun compte/)).toBeVisible();
});

test('les erreurs de saisie sont expliquées et Échap ferme la fenêtre', async ({ page }) => {
  await register(page);
  await page.goto('/dashboard/accounts');
  await page.getByRole('button', { name: 'Ajouter', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Ajouter le compte' }).click();
  await expect(dialog.getByRole('alert')).toContainText(/solde/i);
  await dialog.locator('#account-balance').fill('10');
  await dialog.getByRole('button', { name: 'Ajouter le compte' }).click();
  await expect(dialog.getByRole('alert')).toContainText(/nom/i);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('une position et une opération font bouger le solde, dans les deux sens', async ({ page }) => {
  await register(page);
  await addAccount(page, { name: 'PEA test', balance: '1000', type: 'brokerage' });
  await page.getByText('PEA test').first().click();
  await page.waitForURL(/accounts\/.+/);

  await page.getByRole('button', { name: 'Ajouter' }).first().click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Symbole').fill('cw8');
  await dialog.getByLabel('Nom', { exact: true }).fill('MSCI World');
  await dialog.getByLabel('Classe d\'actif').selectOption('etf');
  await dialog.getByLabel('Quantité').fill('2');
  await dialog.getByLabel('Prix de revient unitaire').fill('400');
  await dialog.getByLabel('Cours actuel').fill('500');
  await dialog.getByRole('button', { name: 'Ajouter la position' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('account-balance')).toContainText('2 000,00'.replace(' ', ' '));
  await expect(page.getByText('CW8')).toBeVisible();
  await expect(page.getByText('+25,00')).toBeVisible();

  await page.getByRole('button', { name: 'Ajouter' }).nth(1).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Type').selectOption('withdrawal');
  await dialog.locator('#tx-amount').fill('100');
  await dialog.locator('#tx-desc').fill('Retrait test');
  await dialog.getByRole('button', { name: /ajouter l.opération/i }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('account-balance')).toContainText('1 900,00');

  await page.getByRole('button', { name: "Supprimer l'opération" }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.getByTestId('account-balance')).toContainText('2 000,00');

  await page.getByRole('button', { name: 'Supprimer CW8' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.getByTestId('account-balance')).toContainText('1 000,00');
});
