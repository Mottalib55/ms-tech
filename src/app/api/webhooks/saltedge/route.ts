import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { syncConnection } from '@/server/sync';
import { parseSaltEdgeWebhook, verifySaltEdgeWebhook } from '@/connectors/saltedge/webhooks';

export async function POST(req: NextRequest) {
  const body = await req.text();
  // Signed over the callback URL as declared in Salt Edge's dashboard.
  const callbackUrl = `${(process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '')}${req.nextUrl.pathname}`;
  if (!verifySaltEdgeWebhook(body, req.headers.get('signature') ?? '', callbackUrl)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const { data } = parseSaltEdgeWebhook(body);
    const connection = data.connection_id
      ? await prisma.providerConnection.findFirst({ where: { provider: 'saltedge', externalId: data.connection_id } })
      : null;
    if (!connection) return NextResponse.json({ received: true });

    // VERIFY: the exact terminal `stage` value on the first real callback (the docs show both).
    if (data.error_class) {
      await prisma.providerConnection.update({
        where: { id: connection.id },
        data: { status: 'error', lastSyncError: 'La banque a signalé une erreur. Reconnectez le compte.' },
      });
    } else if (data.stage === 'finish' || data.stage === 'success') {
      await syncConnection(connection.id).catch((e) => console.error('[saltedge] webhook sync', e));
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[saltedge] webhook', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
