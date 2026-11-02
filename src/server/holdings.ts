import { prisma } from './db';
import { convert, getRates } from './fx';

/**
 * A manual account's balance is what the user can see moving when they add a
 * position, so it follows the position's value. A synced account's balance is
 * the provider's figure and is left alone.
 */
export async function adjustManualBalance(accountId: string, delta: number, currency: string) {
  const account = await prisma.financialAccount.findUnique({ where: { id: accountId } });
  if (!account || account.connectionId || delta === 0) return;
  const rates = await getRates();
  await prisma.financialAccount.update({
    where: { id: accountId },
    data: { balance: account.balance + convert(delta, currency, account.currency, rates), lastSync: new Date() },
  });
}
