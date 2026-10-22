import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/server/db';
import { authOptions } from '@/server/auth';

export async function GET(
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
      include: {
        financialAccounts: {
          select: {
            id: true,
            name: true,
            institution: true,
            type: true,
            balance: true,
            currency: true,
          },
        },
        syncLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            durationMs: true,
            recordCount: true,
            error: true,
            createdAt: true,
          },
        },
      },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: connection.id,
      provider: connection.provider,
      status: connection.status,
      externalId: connection.externalId,
      lastSyncAt: connection.lastSyncAt,
      lastSyncStatus: connection.lastSyncStatus,
      lastSyncError: connection.lastSyncError,
      createdAt: connection.createdAt,
      accounts: connection.financialAccounts,
      syncLogs: connection.syncLogs,
    });
  } catch (error) {
    console.error('Error fetching connection:', error);
    return NextResponse.json({ error: 'Failed to fetch connection' }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.providerConnection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
  }
}
