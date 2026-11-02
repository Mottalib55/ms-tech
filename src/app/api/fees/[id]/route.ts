import { prisma } from '@/server/db';
import { notFound, requireUser, route } from '@/server/http';

export const DELETE = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const { count } = await prisma.fee.deleteMany({ where: { id, account: { userId: user.id } } });
  if (!count) throw notFound('Frais');
  return { success: true };
});
