import { prisma } from '@/server/db';
import { notFound, requireUser, route } from '@/server/http';

export const DELETE = route(async (_req: Request, { params }: { params: Promise<{ month: string }> }) => {
  const user = await requireUser();
  const { month } = await params;
  const { count } = await prisma.monthlyBudget.deleteMany({ where: { userId: user.id, month } });
  if (!count) throw notFound('Mois');
  return { success: true };
});
