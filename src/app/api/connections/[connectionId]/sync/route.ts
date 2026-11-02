import { prisma } from '@/server/db';
import { ApiError, notFound, requireUser, route } from '@/server/http';
import { enforce } from '@/server/limiter';
import { syncConnection } from '@/server/sync';

export const POST = route(async (_req: Request, { params }: { params: Promise<{ connectionId: string }> }) => {
  const user = await requireUser();
  const { connectionId } = await params;
  await enforce(`sync:${user.id}`, 30, 300);
  const connection = await prisma.providerConnection.findFirst({ where: { id: connectionId, userId: user.id } });
  if (!connection) throw notFound('connection');
  try {
    return await syncConnection(connectionId);
  } catch (error) {
    throw new ApiError(502, error instanceof Error ? error.message : 'errors.connections.syncFailed');
  }
});
