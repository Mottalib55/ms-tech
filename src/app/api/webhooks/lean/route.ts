import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getConnector } from '@/connectors/registry';
import { decrypt } from '@/server/encryption';
import { persistSyncResult } from '@/server/sync';
import { parseLeanWebhook } from '@/connectors/lean/webhooks';
import type { ProviderSlug } from '@/connectors/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-lean-signature') || '';

    const connector = getConnector('lean' as ProviderSlug);
    if (!connector.verifyWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = parseLeanWebhook(body);

    const connection = await prisma.providerConnection.findFirst({
      where: { provider: 'lean', externalId: payload.entity_id },
    });

    if (!connection?.accessTokenEnc) {
      return NextResponse.json({ received: true });
    }

    try {
      const accessToken = await decrypt(connection.accessTokenEnc);
      const syncResult = await connector.sync(accessToken);
      await persistSyncResult(connection.id, connection.userId, syncResult);
    } catch (syncError) {
      console.error('Lean webhook sync failed:', syncError);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Lean webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
