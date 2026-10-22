import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getConnector } from '@/connectors/registry';
import { decrypt } from '@/server/encryption';
import { persistSyncResult } from '@/server/sync';
import type { ProviderSlug } from '@/connectors/types';

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all active connections that haven't synced in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const staleConnections = await prisma.providerConnection.findMany({
      where: {
        status: 'active',
        accessTokenEnc: { not: null },
        OR: [
          { lastSyncAt: null },
          { lastSyncAt: { lt: oneHourAgo } },
        ],
      },
    });

    const results: { connectionId: string; provider: string; status: string; error?: string }[] = [];

    for (const connection of staleConnections) {
      try {
        const connector = getConnector(connection.provider as ProviderSlug);
        const accessToken = await decrypt(connection.accessTokenEnc!);

        // Check if token needs refresh
        if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
          if (connection.refreshTokenEnc) {
            const refreshToken = await decrypt(connection.refreshTokenEnc);
            const newTokens = await connector.refreshCredentials(refreshToken);

            const { encrypt } = await import('@/server/encryption');
            await prisma.providerConnection.update({
              where: { id: connection.id },
              data: {
                accessTokenEnc: await encrypt(newTokens.accessToken),
                refreshTokenEnc: newTokens.refreshToken
                  ? await encrypt(newTokens.refreshToken)
                  : connection.refreshTokenEnc,
                tokenExpiresAt: newTokens.expiresAt ?? null,
              },
            });
          }
        }

        const syncResult = await connector.sync(accessToken);
        await persistSyncResult(connection.id, connection.userId, syncResult);

        results.push({
          connectionId: connection.id,
          provider: connection.provider,
          status: 'success',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          connectionId: connection.id,
          provider: connection.provider,
          status: 'error',
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      synced: results.filter((r) => r.status === 'success').length,
      errors: results.filter((r) => r.status === 'error').length,
      total: staleConnections.length,
      results,
    });
  } catch (error) {
    console.error('Cron sync error:', error);
    return NextResponse.json({ error: 'Cron sync failed' }, { status: 500 });
  }
}
