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

    const holdings = await prisma.holding.findMany({
      where: {
        account: { userId },
      },
      select: {
        id: true,
        symbol: true,
        name: true,
        quantity: true,
        avgPrice: true,
        currentPrice: true,
        currency: true,
        assetClass: true,
        sector: true,
        region: true,
        accountId: true,
        dailyChange: true,
      },
    });

    return NextResponse.json(holdings);
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holdings' },
      { status: 500 }
    );
  }
}
