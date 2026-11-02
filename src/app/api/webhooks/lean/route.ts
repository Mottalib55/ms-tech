import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { syncConnection } from '@/server/sync';
import { parseLeanWebhook, verifyLeanWebhook } from '@/connectors/lean/webhooks';

const SYNC_ON = new Set(['entity.created', 'entity.data.refresh.updated']);

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!verifyLeanWebhook(body, req.headers.get('lean-signature') ?? '')) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = parseLeanWebhook(body);
    const customerId = event.payload?.customer_id;
    // Connections are keyed on the customer: see LeanConnector.
    const connection = customerId
      ? await prisma.providerConnection.findFirst({ where: { provider: 'lean', externalId: customerId, status: { not: 'pending' } } })
      : null;
    if (!connection || !SYNC_ON.has(event.type)) return NextResponse.json({ received: true });
    if (event.type === 'entity.data.refresh.updated' && event.payload?.status !== 'FINISHED') {
      return NextResponse.json({ received: true });
    }
    await syncConnection(connection.id).catch((e) => console.error('[lean] webhook sync', e));
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[lean] webhook', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
