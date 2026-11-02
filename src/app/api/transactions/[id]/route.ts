import { prisma } from '@/server/db';
import { ApiError, notFound, requireUser, route } from '@/server/http';
import { recordSnapshot } from '@/server/summary';

export const DELETE = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const tx = await prisma.transaction.findFirst({ where: { id, account: { userId: user.id } }, include: { account: true } });
  if (!tx) throw notFound('operation');
  if (tx.account.connectionId) throw new ApiError(400, 'errors.accounts.operationSynced');
  await prisma.transaction.delete({ where: { id } });
  await prisma.financialAccount.update({ where: { id: tx.accountId }, data: { balance: tx.account.balance - tx.amount } });
  await recordSnapshot(user.id);
  return { success: true };
});
