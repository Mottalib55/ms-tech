import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { syncConnection } from '@/server/sync';
import { parsePowensWebhook, verifyPowensWebhook } from '@/connectors/powens/webhooks';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const ok = verifyPowensWebhook(
    body,
    req.headers.get('bi-signature') ?? '',
    req.headers.get('bi-signature-date') ?? '',
    req.nextUrl.pathname,
  );
  if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  try {
    const payload = parsePowensWebhook(body);
    const id = payload.connection?.id;
    const connection = id === undefined
      ? null
      : await prisma.providerConnection.findFirst({ where: { provider: 'powens', externalId: String(id) } });
    // 2XX even when unknown: Powens retries until accepted.
    if (!connection) return NextResponse.json({ received: true });

    const error = payload.connection?.error;
    if (error) {
      await prisma.providerConnection.update({
        where: { id: connection.id },
        data: { status: 'error', lastSyncError: payload.connection?.error_message || 'errors.connector.reconnect' },
      });
      return NextResponse.json({ received: true });
    }
    await syncConnection(connection.id).catch((e) => console.error('[powens] webhook sync', e));
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[powens] webhook', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
