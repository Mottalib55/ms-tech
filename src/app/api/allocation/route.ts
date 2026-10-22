import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/server/db';
import { authOptions } from '@/server/auth';

const ASSET_CLASS_CONFIG: Record<string, { name: string; color: string }> = {
  stocks: { name: 'Actions', color: '#f4be7e' },
  etf: { name: 'ETF', color: '#5682f2' },
  crypto: { name: 'Crypto', color: '#f97316' },
  'real-estate': { name: 'Immobilier', color: '#34d399' },
  bonds: { name: 'Obligations', color: '#a78bfa' },
  cash: { name: 'Liquidités', color: '#ec4899' },
  commodities: { name: 'Commodités', color: '#f97316' },
};

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
        assetClass: true,
        quantity: true,
        currentPrice: true,
      },
    });

    const totals: Record<string, number> = {};

    for (const holding of holdings) {
      const value = holding.quantity * holding.currentPrice;
      const key = holding.assetClass;
      totals[key] = (totals[key] || 0) + value;
    }

    const allocation = Object.entries(totals).map(([assetClass, value]) => {
      const config = ASSET_CLASS_CONFIG[assetClass];
      return {
        name: config?.name ?? assetClass,
        value: Math.round(value * 100) / 100,
        color: config?.color ?? '#94a3b8',
      };
    });

    allocation.sort((a, b) => b.value - a.value);

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Error computing allocation:', error);
    return NextResponse.json(
      { error: 'Failed to compute allocation' },
      { status: 500 }
    );
  }
}
