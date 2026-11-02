import { prisma } from '@/server/db';
import { ApiError, ownedAccount, parseBody, requireUser, route } from '@/server/http';
import { recordSnapshot } from '@/server/summary';
import { accountPatchSchema } from '@/server/validations';
import { colorForType } from '@/server/colors';
import { translate } from '@/server/i18n';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  await ownedAccount(user.id, id);
  const account = await prisma.financialAccount.findUnique({
    where: { id },
    include: {
      holdings: { orderBy: { symbol: 'asc' } },
      transactions: { orderBy: { date: 'desc' }, take: 100 },
      connection: { select: { id: true, provider: true, status: true, lastSyncError: true } },
    },
  });
  const lastSyncError = account?.connection?.lastSyncError;
  return {
    ...account,
    manual: !account?.connectionId,
    connection: account?.connection && { ...account.connection, lastSyncError: lastSyncError && await translate(lastSyncError) },
  };
});

export const PATCH = route(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const account = await ownedAccount(user.id, id);
  const data = await parseBody(req, accountPatchSchema);
  // A synced account's figures belong to the provider; only its name is ours.
  const allowed = account.connectionId ? { name: data.name } : data;
  if (account.connectionId && (data.balance !== undefined || data.type !== undefined || data.currency !== undefined)) {
    throw new ApiError(400, 'errors.accounts.balanceSynced');
  }
  const type = allowed.type ?? account.type;
  const updated = await prisma.financialAccount.update({
    where: { id },
    data: {
      ...allowed,
      ...(allowed.balance !== undefined && { balance: type === 'loan' ? Math.abs(allowed.balance) : allowed.balance, lastSync: new Date() }),
      ...(allowed.type && { color: colorForType(allowed.type) }),
    },
  });
  await recordSnapshot(user.id);
  return updated;
});

export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const account = await ownedAccount(user.id, id);
  if (account.connectionId) {
    throw new ApiError(400, 'errors.accounts.accountSynced');
  }
  await prisma.financialAccount.delete({ where: { id } });
  await recordSnapshot(user.id);
  return { success: true };
});
