import { prisma } from '@/server/db';
import { notFound, requireUser, route } from '@/server/http';
import { recordSnapshot } from '@/server/summary';

type Ctx = { params: Promise<{ connectionId: string }> };

export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { connectionId } = await params;
  // Cascades to the accounts it brought: a disconnected bank must leave the net worth.
  const { count } = await prisma.providerConnection.deleteMany({ where: { id: connectionId, userId: user.id } });
  if (!count) throw notFound('connection');
  await recordSnapshot(user.id);
  return { success: true };
});
