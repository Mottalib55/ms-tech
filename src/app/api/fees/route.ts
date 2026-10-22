import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/server/db';
import { authOptions } from '@/server/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const fees = await prisma.fee.findMany({
      where: {
        account: { userId },
      },
      select: {
        id: true,
        accountId: true,
        accountName: true,
        type: true,
        label: true,
        amount: true,
        percentage: true,
        frequency: true,
        suggestion: true,
        alternativeFee: true,
      },
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fees' },
      { status: 500 }
    );
  }
}
