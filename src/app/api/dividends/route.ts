import { prisma } from '@/server/db';
import { notFound, parseBody, requireUser, route } from '@/server/http';
import { dividendSchema } from '@/server/validations';

export const GET = route(async () => {
  const user = await requireUser();
  return prisma.dividend.findMany({ where: { holding: { account: { userId: user.id } } }, orderBy: { payDate: 'asc' } });
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, dividendSchema);
  const holding = await prisma.holding.findFirst({ where: { id: data.holdingId, account: { userId: user.id } } });
  if (!holding) throw notFound('position');
  return prisma.dividend.create({ data: { ...data, symbol: holding.symbol, name: holding.name, isManual: true } });
});
