import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { syncConnection } from '@/server/sync';
import { recordSnapshot } from '@/server/summary';

// Vercel Cron calls GET with `Authorization: Bearer $CRON_SECRET`. The route
// only answered POST before, so the hourly sync never ran; and with no secret
// configured it was open to anyone. It now refuses when the secret is missing.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hourAgo = new Date(Date.now() - 3600_000);
  const stale = await prisma.providerConnection.findMany({
    where: { status: { in: ['active', 'error'] }, accessTokenEnc: { not: null }, OR: [{ lastSyncAt: null }, { lastSyncAt: { lt: hourAgo } }] },
    select: { id: true },
    take: 200,
  });
  let synced = 0;
  let errors = 0;
  for (const { id } of stale) {
    try {
      await syncConnection(id);
      synced += 1;
    } catch {
      errors += 1;
    }
  }

  // Give everyone one point a day on the curve, even with nothing to sync.
  const today = new Date().toISOString().slice(0, 10);
  const users = await prisma.user.findMany({
    where: { isDemo: false, financialAccounts: { some: {} }, performancePoints: { none: { date: today } } },
    select: { id: true },
    take: 500,
  });
  for (const u of users) await recordSnapshot(u.id).catch(() => {});

  const purged = await prisma.user.deleteMany({
    where: { isDemo: true, createdAt: { lt: new Date(Date.now() - 86_400_000) } },
  });
  await prisma.providerConnection.deleteMany({
    where: { status: 'pending', createdAt: { lt: new Date(Date.now() - 3600_000) } },
  });

  return NextResponse.json({ total: stale.length, synced, errors, snapshots: users.length, demoPurged: purged.count });
}
