import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { requireUser, route } from '@/server/http';
import { enforce } from '@/server/limiter';

// RGPD art. 20. Provider tokens stay out: they are ours to protect, not data about the person.
export const GET = route(async () => {
  const user = await requireUser();
  await enforce(`export:${user.id}`, 5, 3600);
  const data = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true, email: true, currency: true, language: true, createdAt: true,
      financialAccounts: {
        select: {
          name: true, institution: true, type: true, balance: true, currency: true, lastSync: true,
          holdings: { select: { symbol: true, name: true, quantity: true, avgPrice: true, currentPrice: true, currency: true, assetClass: true, sector: true, region: true, dividends: { select: { symbol: true, amount: true, currency: true, exDate: true, payDate: true, status: true, frequency: true } } } },
          fees: { select: { type: true, label: true, amount: true, percentage: true, frequency: true } },
          transactions: { select: { type: true, symbol: true, amount: true, currency: true, date: true, description: true } },
        },
      },
      monthlyBudgets: { select: { month: true, income: true, expenses: true, savings: true, categories: { select: { name: true, budgeted: true, spent: true } } } },
      performancePoints: { select: { date: true, value: true } },
      providerConnections: { select: { provider: true, status: true, lastSyncAt: true, createdAt: true } },
    },
  });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="ms-tech-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
});
