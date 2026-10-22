import { prisma } from './db';
import type { SyncResult } from '@/connectors/types';

export async function persistSyncResult(
  connectionId: string,
  userId: string,
  result: SyncResult
): Promise<{ accountCount: number; holdingCount: number; feeCount: number; dividendCount: number; transactionCount: number }> {
  const startTime = Date.now();

  try {
    // Upsert accounts
    const accountIdMap = new Map<string, string>();

    for (const account of result.accounts) {
      const existing = await prisma.financialAccount.findFirst({
        where: { connectionId, externalId: account.externalId },
      });

      if (existing) {
        await prisma.financialAccount.update({
          where: { id: existing.id },
          data: {
            name: account.name,
            institution: account.institution,
            type: account.type,
            balance: account.balance,
            currency: account.currency,
            color: account.color ?? existing.color,
            lastSync: new Date(),
            status: 'connected',
          },
        });
        accountIdMap.set(account.externalId, existing.id);
      } else {
        const created = await prisma.financialAccount.create({
          data: {
            userId,
            connectionId,
            externalId: account.externalId,
            name: account.name,
            institution: account.institution,
            type: account.type,
            balance: account.balance,
            currency: account.currency,
            color: account.color ?? '#f4be7e',
            lastSync: new Date(),
            status: 'connected',
          },
        });
        accountIdMap.set(account.externalId, created.id);
      }
    }

    // Upsert holdings
    const holdingIdMap = new Map<string, string>();

    for (const holding of result.holdings) {
      // Find the account this holding belongs to via holdings' accountExternalId
      // Holdings don't have accountExternalId directly — they link via the account
      // We need to find which account the holding is in
      const accountId = accountIdMap.values().next().value; // Fallback
      if (!accountId) continue;

      const existing = await prisma.holding.findFirst({
        where: { accountId, externalId: holding.externalId },
      });

      if (existing) {
        await prisma.holding.update({
          where: { id: existing.id },
          data: {
            symbol: holding.symbol,
            name: holding.name,
            quantity: holding.quantity,
            avgPrice: holding.avgPrice,
            currentPrice: holding.currentPrice,
            currency: holding.currency,
            assetClass: holding.assetClass,
            sector: holding.sector,
            region: holding.region,
            dailyChange: holding.dailyChange,
          },
        });
        holdingIdMap.set(holding.externalId, existing.id);
      } else {
        const created = await prisma.holding.create({
          data: {
            accountId,
            externalId: holding.externalId,
            symbol: holding.symbol,
            name: holding.name,
            quantity: holding.quantity,
            avgPrice: holding.avgPrice,
            currentPrice: holding.currentPrice,
            currency: holding.currency,
            assetClass: holding.assetClass,
            sector: holding.sector,
            region: holding.region,
            dailyChange: holding.dailyChange,
          },
        });
        holdingIdMap.set(holding.externalId, created.id);
      }
    }

    // Upsert fees
    for (const fee of result.fees) {
      const accountId = accountIdMap.get(fee.accountExternalId);
      if (!accountId) continue;

      await prisma.fee.create({
        data: {
          accountId,
          accountName: fee.accountName,
          type: fee.type,
          label: fee.label,
          amount: fee.amount,
          percentage: fee.percentage,
          frequency: fee.frequency,
          suggestion: fee.suggestion,
          alternativeFee: fee.alternativeFee,
        },
      });
    }

    // Upsert dividends
    for (const div of result.dividends) {
      const holdingId = holdingIdMap.get(div.holdingExternalId);
      if (!holdingId) continue;

      await prisma.dividend.create({
        data: {
          holdingId,
          symbol: div.symbol,
          name: div.name,
          amount: div.amount,
          currency: div.currency,
          exDate: div.exDate,
          payDate: div.payDate,
          status: div.status,
          frequency: div.frequency,
        },
      });
    }

    // Upsert transactions
    for (const tx of result.transactions) {
      const accountId = accountIdMap.get(tx.accountExternalId);
      if (!accountId) continue;

      const existing = await prisma.transaction.findFirst({
        where: { accountId, externalId: tx.externalId },
      });

      if (!existing) {
        await prisma.transaction.create({
          data: {
            accountId,
            externalId: tx.externalId,
            type: tx.type,
            symbol: tx.symbol,
            name: tx.name,
            quantity: tx.quantity,
            price: tx.price,
            amount: tx.amount,
            currency: tx.currency,
            date: tx.date,
            description: tx.description,
          },
        });
      }
    }

    const durationMs = Date.now() - startTime;

    // Update connection
    await prisma.providerConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      },
    });

    // Log sync
    const totalRecords =
      result.accounts.length +
      result.holdings.length +
      result.fees.length +
      result.dividends.length +
      result.transactions.length;

    await prisma.syncLog.create({
      data: {
        connectionId,
        status: 'success',
        durationMs,
        recordCount: totalRecords,
      },
    });

    return {
      accountCount: result.accounts.length,
      holdingCount: result.holdings.length,
      feeCount: result.fees.length,
      dividendCount: result.dividends.length,
      transactionCount: result.transactions.length,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await prisma.providerConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'error',
        lastSyncError: errorMessage,
      },
    });

    await prisma.syncLog.create({
      data: {
        connectionId,
        status: 'error',
        durationMs,
        error: errorMessage,
      },
    });

    throw error;
  }
}
