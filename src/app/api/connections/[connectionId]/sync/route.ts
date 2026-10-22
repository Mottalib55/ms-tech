import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/server/db';
import { authOptions } from '@/server/auth';
import { getConnector } from '@/connectors/registry';
import { decrypt } from '@/server/encryption';
import { persistSyncResult } from '@/server/sync';
import type { ProviderSlug } from '@/connectors/types';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = await params;

    const connection = await prisma.providerConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id,
      },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (!connection.accessTokenEnc) {
      return NextResponse.json({ error: 'Connection not authenticated' }, { status: 400 });
    }

    const connector = getConnector(connection.provider as ProviderSlug);
    const accessToken = await decrypt(connection.accessTokenEnc);

    const syncResult = await connector.sync(accessToken);
    const counts = await persistSyncResult(connectionId, session.user.id, syncResult);

    return NextResponse.json({
      success: true,
      ...counts,
    });
  } catch (error) {
    console.error('Error syncing connection:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
