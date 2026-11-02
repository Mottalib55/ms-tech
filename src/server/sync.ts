import { prisma } from './db';
import { decrypt, encrypt } from './encryption';
import { recordSnapshot } from './summary';
import { getConnector } from '@/connectors/registry';
import type { ProviderSlug, SyncResult } from '@/connectors/types';

const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);

/**
 * Writes one provider response as the new truth for its connection, in one
 * transaction: an interrupted sync leaves the previous figures rather than half
 * of the new ones. What the provider no longer reports disappears; what the
 * user entered by hand on a synced account stays.
 */
export async function persistSyncResult(connectionId: string, userId: string, result: SyncResult) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const accountIds = new Map<string, string>();
    for (const a of result.accounts) {
      const existing = await tx.financialAccount.findFirst({ where: { connectionId, externalId: a.externalId } });
      const data = {
        institution: a.institution, type: a.type, balance: num(a.balance), currency: a.currency,
        lastSync: now, status: 'connected',
      };
      const row = existing
        // The name stays: the user may have renamed it.
        ? await tx.financialAccount.update({ where: { id: existing.id }, data: { ...data, color: a.color ?? existing.color } })
        : await tx.financialAccount.create({
            data: { ...data, userId, connectionId, externalId: a.externalId, name: a.name, color: a.color ?? '#f4be7e' },
          });
      accountIds.set(a.externalId, row.id);
    }
    await tx.financialAccount.deleteMany({
      where: { connectionId, externalId: { notIn: result.accounts.map((a) => a.externalId) } },
    });

    const holdingIds = new Map<string, string>();
    const reported = new Map<string, string[]>();
    for (const h of result.holdings) {
      const accountId = accountIds.get(h.accountExternalId);
      if (!accountId) continue;
      const { accountExternalId: _a, externalId, ...fields } = h;
      const clean = { ...fields, quantity: num(h.quantity), avgPrice: num(h.avgPrice), currentPrice: num(h.currentPrice), dailyChange: num(h.dailyChange) };
      const existing = await tx.holding.findFirst({ where: { accountId, externalId } });
      const row = existing
        ? await tx.holding.update({ where: { id: existing.id }, data: clean })
        : await tx.holding.create({ data: { ...clean, accountId, externalId } });
      holdingIds.set(externalId, row.id);
      reported.set(accountId, [...(reported.get(accountId) ?? []), externalId]);
    }
    for (const accountId of accountIds.values()) {
      await tx.holding.deleteMany({
        where: { accountId, externalId: { not: null, notIn: reported.get(accountId) ?? [] } },
      });
    }

    // Fees and dividends carry no provider id: replaced wholesale, or every
    // sync would add another copy.
    const ids = [...accountIds.values()];
    await tx.fee.deleteMany({ where: { accountId: { in: ids }, isManual: false } });
    await tx.dividend.deleteMany({ where: { holding: { accountId: { in: ids } }, isManual: false } });
    for (const f of result.fees) {
      const accountId = accountIds.get(f.accountExternalId);
      if (!accountId) continue;
      const { accountExternalId: _a, ...fee } = f;
      await tx.fee.create({ data: { ...fee, accountId } });
    }
    for (const d of result.dividends) {
      const holdingId = holdingIds.get(d.holdingExternalId);
      if (!holdingId) continue;
      const { holdingExternalId: _h, ...div } = d;
      await tx.dividend.create({ data: { ...div, holdingId } });
    }

    for (const t of result.transactions) {
      const accountId = accountIds.get(t.accountExternalId);
      if (!accountId) continue;
      const { accountExternalId: _a, externalId, ...fields } = t;
      const existing = await tx.transaction.findFirst({ where: { accountId, externalId } });
      if (existing) await tx.transaction.update({ where: { id: existing.id }, data: fields });
      else await tx.transaction.create({ data: { ...fields, accountId, externalId } });
    }

    await tx.providerConnection.update({
      where: { id: connectionId },
      data: { status: 'active', lastSyncAt: now, lastSyncStatus: 'success', lastSyncError: null },
    });
  }, { timeout: 30_000 });

  const counts = {
    accountCount: result.accounts.length, holdingCount: result.holdings.length,
    feeCount: result.fees.length, dividendCount: result.dividends.length, transactionCount: result.transactions.length,
  };
  await prisma.syncLog.create({
    data: { connectionId, status: 'success', recordCount: Object.values(counts).reduce((a, b) => a + b, 0) },
  });
  await recordSnapshot(userId);
  return counts;
}

/** The one way a connection gets refreshed: button, cron, webhook and first connection. */
export async function syncConnection(connectionId: string) {
  const connection = await prisma.providerConnection.findUnique({ where: { id: connectionId } });
  if (!connection) throw new Error('errors.notFound.connection');
  if (!connection.accessTokenEnc) throw new Error('errors.connector.notFinalized');
  const started = Date.now();
  const connector = getConnector(connection.provider as ProviderSlug);
  const owner = await prisma.user.findUnique({ where: { id: connection.userId }, select: { language: true } });
  try {
    let accessToken = await decrypt(connection.accessTokenEnc);
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date() && connection.refreshTokenEnc) {
      const fresh = await connector.refreshCredentials(await decrypt(connection.refreshTokenEnc));
      accessToken = fresh.accessToken;
      await prisma.providerConnection.update({
        where: { id: connectionId },
        data: {
          accessTokenEnc: await encrypt(fresh.accessToken),
          refreshTokenEnc: fresh.refreshToken ? await encrypt(fresh.refreshToken) : connection.refreshTokenEnc,
          tokenExpiresAt: fresh.expiresAt ?? null,
        },
      });
    }
    const result = await connector.sync({
      accessToken,
      apiSecret: connection.apiSecretEnc ? await decrypt(connection.apiSecretEnc) : undefined,
      externalId: connection.externalId ?? undefined,
      locale: owner?.language,
    });
    return await persistSyncResult(connectionId, connection.userId, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'errors.connector.unknown';
    await prisma.providerConnection.update({
      where: { id: connectionId },
      data: { status: 'error', lastSyncAt: new Date(), lastSyncStatus: 'error', lastSyncError: message },
    });
    await prisma.financialAccount.updateMany({ where: { connectionId }, data: { status: 'error' } });
    await prisma.syncLog.create({ data: { connectionId, status: 'error', durationMs: Date.now() - started, error: message } });
    throw error;
  }
}
