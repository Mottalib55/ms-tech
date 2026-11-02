import { prisma } from '@/server/db';
import { notFound, parseBody, requireUser, route } from '@/server/http';
import { adjustManualBalance } from '@/server/holdings';
import { recordSnapshot } from '@/server/summary';
import { holdingPatchSchema } from '@/server/validations';

type Ctx = { params: Promise<{ id: string }> };

async function owned(userId: string, id: string) {
  const holding = await prisma.holding.findFirst({ where: { id, account: { userId } } });
  if (!holding) throw notFound('position');
  return holding;
}

export const PATCH = route(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const before = await owned(user.id, id);
  const data = await parseBody(req, holdingPatchSchema);
  const after = await prisma.holding.update({ where: { id }, data });
  await adjustManualBalance(before.accountId, -before.quantity * before.currentPrice, before.currency);
  await adjustManualBalance(before.accountId, after.quantity * after.currentPrice, after.currency);
  await recordSnapshot(user.id);
  return after;
});

export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const holding = await owned(user.id, id);
  await prisma.holding.delete({ where: { id } });
  await adjustManualBalance(holding.accountId, -holding.quantity * holding.currentPrice, holding.currency);
  await recordSnapshot(user.id);
  return { success: true };
});
