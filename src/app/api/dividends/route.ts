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

    const dividends = await prisma.dividend.findMany({
      where: {
        holding: {
          account: { userId },
        },
      },
      select: {
        id: true,
        holdingId: true,
        symbol: true,
        name: true,
        amount: true,
        currency: true,
        exDate: true,
        payDate: true,
        status: true,
        frequency: true,
      },
    });

    return NextResponse.json(dividends);
  } catch (error) {
    console.error('Error fetching dividends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dividends' },
      { status: 500 }
    );
  }
}
