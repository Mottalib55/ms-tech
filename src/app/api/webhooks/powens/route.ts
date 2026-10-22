import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getConnector } from '@/connectors/registry';
import { decrypt } from '@/server/encryption';
import { persistSyncResult } from '@/server/sync';
import { parsePowensWebhook } from '@/connectors/powens/webhooks';
import type { ProviderSlug } from '@/connectors/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';

    const connector = getConnector('powens' as ProviderSlug);

    if (!connector.verifyWebhook(body, signature)) {
      console.warn('Invalid Powens webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = parsePowensWebhook(body);

    // Find the connection by external ID
    const connection = await prisma.providerConnection.findFirst({
      where: {
        provider: 'powens',
        externalId: String(payload.id_connection),
      },
    });

    if (!connection) {
      console.warn(`Powens webhook: connection not found for id_connection=${payload.id_connection}`);
      return NextResponse.json({ received: true });
    }

    if (payload.state === 'SyncDone' || payload.state === 'webuserActionNeeded') {
      if (connection.accessTokenEnc) {
        try {
          const accessToken = await decrypt(connection.accessTokenEnc);
          const syncResult = await connector.sync(accessToken);
          await persistSyncResult(connection.id, connection.userId, syncResult);
        } catch (syncError) {
          console.error('Powens webhook sync failed:', syncError);
        }
      }
    }

    if (payload.error) {
      await prisma.providerConnection.update({
        where: { id: connection.id },
        data: {
          status: 'error',
          lastSyncError: payload.error_message || payload.error,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Powens webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
