import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { startDemo, watchErrors } from './helpers';

const ROUTES = ['/dashboard', '/dashboard/accounts', '/dashboard/portfolio', '/dashboard/connections', '/dashboard/budget', '/dashboard/dividends', '/dashboard/fees', '/dashboard/predict', '/dashboard/simulators', '/dashboard/settings'];
const SHOTS = '../ms-tech-captures/apres';

/** Everything a person could press, by its position in the page. */
const pressable = (page: Page) => page.locator('main button:not([disabled]), main a[href], main [role=tab], main [role=radio], header button, header a[href]');

async function signature(page: Page) {
  return page.evaluate(() => `${location.pathname}${location.search}|${document.body.innerText.length}|${document.querySelectorAll('[role=dialog]').length}|${document.body.innerHTML.length}`);
}

for (const route of ROUTES) {
  test(`aucun bouton mort, débordement ni erreur : ${route}`, async ({ page, isMobile }, info) => {
    test.setTimeout(240_000);
    const errors = watchErrors(page);
    await startDemo(page);
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: `${SHOTS}/${info.project.name}-${route.replace(/\W+/g, '_')}.png`, fullPage: true });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'la page déborde horizontalement').toBeLessThanOrEqual(0);
    await expect(page.locator('body')).not.toContainText(/NaN|Infinity|undefined|\[object/);

    if (isMobile) {
      const tiny = await page.evaluate(() => [...document.querySelectorAll('main button, nav a, nav button, header button')]
        .filter((e) => (e as HTMLElement).offsetParent !== null)
        .map((e) => ({ t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30), r: e.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && (r.height < 36 || r.width < 36))
        .map(({ t, r }) => `${t} ${Math.round(r.width)}x${Math.round(r.height)}`));
      expect(tiny, 'cibles tactiles trop petites').toEqual([]);
    }

    const count = await pressable(page).count();
    const dead: string[] = [];
    for (let i = 0; i < count; i++) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const el = pressable(page).nth(i);
      if (!(await el.isVisible().catch(() => false))) continue;
      const name = ((await el.innerText().catch(() => '')) || (await el.getAttribute('aria-label')) || `#${i}`).trim().slice(0, 40);
      // Never fire the irreversible ones here: dedicated tests cover them.
      if (/déconnexion|se déconnecter|supprimer mon compte|quitter la démo/i.test(name)) continue;
      // Nothing to do by design: a link to this very page, a reset with nothing changed (tested in pages.spec).
      if (/réinitialiser/i.test(name) || (await el.getAttribute('href')) === `/fr${route}`) continue;
      const before = await signature(page);
      if ((await el.getAttribute('href'))?.startsWith('/api/')) continue;
      await el.click({ timeout: 4000 }).catch(() => dead.push(`${name} (non cliquable)`));
      await page.waitForTimeout(350);
      // A dialog must be on top of everything: each of its controls can really be pressed.
      const hidden = await page.evaluate(() => {
        const d = document.querySelector('[role=dialog]');
        if (!d) return [];
        return [...d.querySelectorAll('button, input, select')].filter((c) => {
          c.scrollIntoView({ block: 'nearest' });
          const r = c.getBoundingClientRect();
          const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return !top || !d.contains(top);
        }).map((c) => c.textContent || c.id);
      });
      if (hidden.length) dead.push(`${name} : fenêtre masquée (${hidden.join(', ')})`);
      // A client navigation can take a moment on a phone: leave it 2 s before calling it dead.
      for (let w = 0; w < 8 && (await signature(page)) === before; w++) await page.waitForTimeout(250);
      if ((await signature(page)) === before) {
        // A radio already selected or a form's submit with empty fields shows nothing by design.
        const pressed = (await el.getAttribute('aria-checked').catch(() => null)) === 'true' || (await el.getAttribute('aria-selected').catch(() => null)) === 'true';
        if (!pressed) dead.push(name);
      }
    }
    expect(dead, 'boutons sans aucun effet').toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('rapidité : chargement et navigation', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await startDemo(page);
  const timings: Record<string, number> = {};
  for (const route of ROUTES) {
    const t = Date.now();
    await page.goto(route);
    await page.locator('main h1').first().waitFor();
    timings[route] = Date.now() - t;
    expect(timings[route], route).toBeLessThan(2500);
  }
  console.log('chargement complet (ms)', JSON.stringify(timings));
  const t = Date.now();
  await page.getByRole('link', { name: 'Budget' }).first().click();
  await page.getByRole('heading', { name: 'Budget', exact: true }).waitFor();
  const nav = Date.now() - t;
  console.log('navigation interne (ms)', nav);
  expect(nav).toBeLessThan(1000);
});
