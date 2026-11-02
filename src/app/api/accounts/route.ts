import { prisma } from '@/server/db';
import { parseBody, requireUser, route } from '@/server/http';
import { recordSnapshot } from '@/server/summary';
import { accountSchema } from '@/server/validations';
import { colorForType } from '@/server/colors';

export const GET = route(async () => {
  const user = await requireUser();
  const accounts = await prisma.financialAccount.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: 'asc' }],
    include: { connection: { select: { provider: true, status: true, lastSyncError: true } }, _count: { select: { holdings: true } } },
  });
  return accounts.map(({ userId: _u, externalId: _e, _count, connection, ...a }) => ({
    ...a,
    positionCount: _count.holdings,
    provider: connection?.provider ?? null,
    manual: !a.connectionId,
    syncError: connection?.lastSyncError ?? null,
  }));
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, accountSchema);
  const account = await prisma.financialAccount.create({
    data: {
      ...data,
      institution: data.institution || 'Saisie manuelle',
      balance: data.type === 'loan' ? Math.abs(data.balance) : data.balance,
      userId: user.id,
      color: colorForType(data.type),
      status: 'manual',
      lastSync: new Date(),
    },
  });
  await recordSnapshot(user.id);
  return account;
});
