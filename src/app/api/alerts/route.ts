import { prisma } from '@/server/db';
import { requireUser, route } from '@/server/http';

// The bell only rings for something the user can act on, computed from their data.
export const GET = route(async () => {
  const user = await requireUser();
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
    alerts.push({ id: `conn-${c.id}`, level: 'error', title: `Synchronisation ${c.provider} en erreur`, detail: c.lastSyncError ?? 'Reconnectez le compte.', href: '/dashboard/connections' });
  }
  for (const cat of budget?.categories.filter((x) => x.spent > x.budgeted) ?? []) {
    alerts.push({ id: `cat-${cat.id}`, level: 'warning', title: `Budget dépassé : ${cat.name}`, detail: `${Math.round(cat.spent - cat.budgeted)} ${user.currency} au-delà du prévu.`, href: '/dashboard/budget' });
  }
  for (const d of upcoming) {
    alerts.push({ id: `div-${d.id}`, level: 'info', title: `Dividende ${d.symbol} à venir`, detail: `${d.amount.toFixed(2)} ${d.currency} le ${d.payDate.split('-').reverse().join('/')}.`, href: '/dashboard/dividends' });
  }
  if (stale) {
    alerts.push({ id: 'stale', level: 'info', title: `${stale} compte${stale > 1 ? 's' : ''} manuel${stale > 1 ? 's' : ''} à actualiser`, detail: 'Non mis à jour depuis plus de 3 mois.', href: '/dashboard/accounts' });
  }
  return alerts;
});
