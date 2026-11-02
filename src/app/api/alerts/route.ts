import { prisma } from '@/server/db';
import { requireUser, route } from '@/server/http';
import { requestLocale, translate } from '@/server/i18n';

const DATE_LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-AE-u-nu-latn' };

// The bell only rings for something the user can act on, computed from their data.
export const GET = route(async () => {
  const user = await requireUser();
  const locale = await requestLocale();
  const t = (key: string, values?: Record<string, string | number>) => translate(`server.alerts.${key}`, values, locale);
  const alerts: { id: string; level: 'error' | 'warning' | 'info'; title: string; detail: string; href: string }[] = [];
  const [connections, budget, upcoming, stale] = await Promise.all([
    prisma.providerConnection.findMany({ where: { userId: user.id, status: 'error' } }),
    prisma.monthlyBudget.findFirst({ where: { userId: user.id }, orderBy: { month: 'desc' }, include: { categories: true } }),
    prisma.dividend.findMany({
      where: {
        holding: { account: { userId: user.id } },
        status: { not: 'paid' },
        payDate: { gte: new Date().toISOString().slice(0, 10), lte: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10) },
      },
      orderBy: { payDate: 'asc' },
      take: 3,
    }),
    prisma.financialAccount.count({ where: { userId: user.id, connectionId: null, type: { not: 'loan' }, updatedAt: { lt: new Date(Date.now() - 90 * 86_400_000) } } }),
  ]);
  for (const c of connections) {
    const provider = await translate(`server.provider.${c.provider}.name`, undefined, locale);
    alerts.push({ id: `conn-${c.id}`, level: 'error', title: await t('syncError', { provider }), detail: await translate(c.lastSyncError ?? 'errors.connector.reconnect', undefined, locale), href: '/dashboard/connections' });
  }
  for (const cat of budget?.categories.filter((x) => x.spent > x.budgeted) ?? []) {
    alerts.push({ id: `cat-${cat.id}`, level: 'warning', title: await t('budgetExceeded', { name: cat.name }), detail: await t('budgetDetail', { amount: Math.round(cat.spent - cat.budgeted), currency: user.currency }), href: '/dashboard/budget' });
  }
  for (const d of upcoming) {
    const date = new Date(`${d.payDate}T12:00:00Z`).toLocaleDateString(DATE_LOCALES[locale], { day: 'numeric', month: 'short', year: 'numeric' });
    alerts.push({ id: `div-${d.id}`, level: 'info', title: await t('dividendUpcoming', { symbol: d.symbol }), detail: await t('dividendDetail', { amount: d.amount.toFixed(2), currency: d.currency, date }), href: '/dashboard/dividends' });
  }
  if (stale) {
    alerts.push({ id: 'stale', level: 'info', title: await t('staleTitle', { count: stale }), detail: await t('staleDetail'), href: '/dashboard/accounts' });
  }
  return alerts;
});
