import { prisma } from '@/server/db';
import { requireUser, route } from '@/server/http';

export const GET = route(async () => {
  const user = await requireUser();
  return prisma.performancePoint.findMany({
    where: { userId: user.id },
    select: { date: true, value: true },
    orderBy: { date: 'asc' },
  });
});
