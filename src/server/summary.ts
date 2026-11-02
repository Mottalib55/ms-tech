import { prisma } from './db';
import { convert, getRates } from './fx';
import { ACCOUNT_TYPES, diversificationScore, percentChange, toAllocation } from '@/lib/finance';

/** One figure of record for a user: everything is converted to their currency. */
export async function computeSummary(userId: string, currency: string) {
  const [accounts, rates, dividends, snapshots] = await Promise.all([
    prisma.financialAccount.findMany({
      where: { userId },
      include: { holdings: true },
      orderBy: { createdAt: 'asc' },
    }),
    getRates(),
    prisma.dividend.findMany({ where: { holding: { account: { userId } } } }),
    prisma.performancePoint.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
  ]);

  let assets = 0;
  let debts = 0;
  const totals: Record<string, number> = {};
  const add = (k: string, v: number) => { totals[k] = (totals[k] ?? 0) + v; };

  for (const a of accounts) {
    const value = convert(a.balance, a.currency, currency, rates);
    const type = ACCOUNT_TYPES[a.type] ?? ACCOUNT_TYPES.other;
    if (type.debt) {
      debts += Math.abs(value);
      continue;
    }
    assets += value;
    // Positions are part of the account's balance: what they do not explain is
    // the account's own class (cash for a bank or a broker).
    let inPositions = 0;
    for (const h of a.holdings) {
      const hv = convert(h.quantity * h.currentPrice, h.currency, currency, rates);
      add(h.assetClass, hv);
      inPositions += hv;
    }
    const rest = value - inPositions;
    if (rest > 0.005) add(type.assetClass, rest);
  }

  const netWorth = assets - debts;
  const allocation = toAllocation(totals);
  const yearAgo = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const passiveIncome = dividends
    .filter((d) => d.payDate >= yearAgo && d.status === 'paid')
    .reduce((s, d) => s + convert(d.amount, d.currency, currency, rates), 0);

  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const reference = [...snapshots].reverse().find((p) => p.date <= monthAgo) ?? snapshots[0];

  return {
    currency,
    netWorth,
    assets,
    debts,
    allocation,
    accountCount: accounts.length,
    connectedCount: accounts.filter((a) => a.connectionId).length,
    errorCount: accounts.filter((a) => a.status === 'error').length,
    positionCount: accounts.reduce((s, a) => s + a.holdings.length, 0),
    passiveIncome,
    diversification: diversificationScore(allocation),
    change30d: reference && reference.date !== new Date().toISOString().slice(0, 10)
      ? percentChange(reference.value, netWorth)
      : null,
    lastSync: accounts.reduce<Date | null>(
      (latest, a) => (a.lastSync && (!latest || a.lastSync > latest) ? a.lastSync : latest),
      null,
    ),
  };
}

/** Today's point on the net-worth curve; called after anything that moves it. */
export async function recordSnapshot(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { currency: true } });
  if (!user) return;
  const { netWorth } = await computeSummary(userId, user.currency);
  const date = new Date().toISOString().slice(0, 10);
  const value = Math.round(netWorth * 100) / 100;
  await prisma.performancePoint.upsert({
    where: { userId_date: { userId, date } },
    update: { value },
    create: { userId, date, value },
  });
}
