import { prisma } from '@/server/db';
import { ownedAccount, parseBody, requireUser, route } from '@/server/http';
import { adjustManualBalance } from '@/server/holdings';
import { recordSnapshot } from '@/server/summary';
import { holdingSchema } from '@/server/validations';

export const GET = route(async () => {
  const user = await requireUser();
  return prisma.holding.findMany({
    where: { account: { userId: user.id } },
    include: { account: { select: { name: true, connectionId: true } } },
    orderBy: { symbol: 'asc' },
  });
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, holdingSchema);
  await ownedAccount(user.id, data.accountId);
  const holding = await prisma.holding.create({ data });
  await adjustManualBalance(data.accountId, data.quantity * data.currentPrice, data.currency);
  await recordSnapshot(user.id);
  return holding;
});
