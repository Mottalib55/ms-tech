import { prisma } from '@/server/db';
import { ApiError, ownedAccount, parseBody, requireUser, route } from '@/server/http';
import { recordSnapshot } from '@/server/summary';
import { transactionSchema } from '@/server/validations';

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const { updateBalance, date, ...data } = await parseBody(req, transactionSchema);
  const account = await ownedAccount(user.id, data.accountId);
  if (account.connectionId) throw new ApiError(400, 'Les opérations de ce compte viennent de sa connexion.');
  const tx = await prisma.transaction.create({ data: { ...data, currency: account.currency, date: new Date(`${date}T12:00:00Z`) } });
  if (updateBalance) {
    await prisma.financialAccount.update({ where: { id: account.id }, data: { balance: account.balance + data.amount, lastSync: new Date() } });
    await recordSnapshot(user.id);
  }
  return tx;
});
