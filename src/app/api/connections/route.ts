import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/server/db';
import { authOptions } from '@/server/auth';
import { getConnector } from '@/connectors/registry';
import { connectProviderSchema } from '@/server/validations';
import type { ProviderSlug } from '@/connectors/types';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await prisma.providerConnection.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        status: true,
        externalId: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        lastSyncError: true,
        createdAt: true,
      },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = connectProviderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { provider, callbackUrl } = parsed.data;
    const connector = getConnector(provider as ProviderSlug);
    const origin = callbackUrl || `${process.env.NEXTAUTH_URL}/dashboard/connections`;
    const result = await connector.initiateConnection(session.user.id, origin);

    // Create pending connection record
    const connection = await prisma.providerConnection.create({
      data: {
        userId: session.user.id,
        provider,
        status: 'pending',
        externalId: result.connectionId,
      },
    });

    return NextResponse.json({
      connectionId: connection.id,
      ...result,
    });
  } catch (error) {
    console.error('Error initiating connection:', error);
    return NextResponse.json({ error: 'Failed to initiate connection' }, { status: 500 });
  }
}
