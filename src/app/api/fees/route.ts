import { prisma } from '@/server/db';
import { ownedAccount, parseBody, requireUser, route } from '@/server/http';
import { feeSchema } from '@/server/validations';

export const GET = route(async () => {
  const user = await requireUser();
  return prisma.fee.findMany({ where: { account: { userId: user.id } }, orderBy: { amount: 'desc' } });
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, feeSchema);
  const account = await ownedAccount(user.id, data.accountId);
  return prisma.fee.create({ data: { ...data, accountName: account.name, isManual: true } });
});
