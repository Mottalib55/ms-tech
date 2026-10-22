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

    const points = await prisma.performancePoint.findMany({
      where: { userId },
      select: {
        date: true,
        value: true,
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(points);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
