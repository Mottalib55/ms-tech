import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getConnector } from '@/connectors/registry';
import { decrypt } from '@/server/encryption';
import { persistSyncResult } from '@/server/sync';
import { parseSaltEdgeWebhook } from '@/connectors/saltedge/webhooks';
import type { ProviderSlug } from '@/connectors/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('signature') || '';

    const connector = getConnector('saltedge' as ProviderSlug);
    if (!connector.verifyWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = parseSaltEdgeWebhook(body);
    const connectionId = payload.data.connection_id;

    const connection = await prisma.providerConnection.findFirst({
      where: { provider: 'saltedge', externalId: connectionId },
    });

    if (!connection?.accessTokenEnc) {
      return NextResponse.json({ received: true });
    }

    if (payload.data.stage === 'finish') {
      try {
        const accessToken = await decrypt(connection.accessTokenEnc);
        const syncResult = await connector.sync(accessToken);
        await persistSyncResult(connection.id, connection.userId, syncResult);
      } catch (syncError) {
        console.error('Salt Edge webhook sync failed:', syncError);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Salt Edge webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
