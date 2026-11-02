import { prisma } from './db';
import { translate } from './i18n';
import type { Locale } from '@/i18n/routing';

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** A believable household, clearly invented, relative to today so nothing looks stale. */
export async function createDemoData(userId: string, locale: Locale = 'en') {
  const l = (key: string) => translate(`server.demo.${key}`, undefined, locale);
  const broker = await l('broker');
  const bank = await l('bank');
  const peaName = await l('pea');
  const ctoName = await l('cto');
  const now = new Date();
  const dayAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
  const account = (data: { name: string; institution: string; type: string; balance: number; color: string; currency?: string }) =>
    prisma.financialAccount.create({ data: { ...data, userId, status: 'manual', lastSync: dayAgo(1) } });

  const pea = await account({ name: peaName, institution: broker, type: 'brokerage', balance: 58_240, color: '#f4be7e' });
  const cto = await account({ name: ctoName, institution: broker, type: 'brokerage', balance: 31_480, color: '#5682f2' });
  await account({ name: await l('savings'), institution: bank, type: 'bank', balance: 22_950, color: '#22d3ee' });
  await account({ name: await l('checking'), institution: bank, type: 'bank', balance: 4_310, color: '#5682f2' });
  await account({ name: await l('lifeInsurance'), institution: await l('insurer'), type: 'insurance', balance: 46_700, color: '#a78bfa' });
  const crypto = await account({ name: await l('cryptoWallet'), institution: await l('platform'), type: 'crypto', balance: 12_600, color: '#f97316' });
  await account({ name: await l('flat'), institution: await l('ownEstimate'), type: 'real-estate', balance: 285_000, color: '#34d399' });
  await account({ name: await l('mortgage'), institution: bank, type: 'loan', balance: 168_400, color: '#f87171' });

  const position = (accountId: string, h: { symbol: string; name: string; quantity: number; avgPrice: number; currentPrice: number; assetClass: string; sector: string; region: string; dailyChange: number }) =>
    prisma.holding.create({ data: { ...h, accountId, currency: 'EUR' } });

  const cw8 = await position(pea.id, { symbol: 'CW8', name: 'Amundi MSCI World UCITS ETF', quantity: 70, avgPrice: 402, currentPrice: 498.35, assetClass: 'etf', sector: 'diversified', region: 'world', dailyChange: 0.42 });
  const tte = await position(pea.id, { symbol: 'TTE', name: 'TotalEnergies', quantity: 140, avgPrice: 54.2, currentPrice: 58.4, assetClass: 'stocks', sector: 'energy', region: 'france', dailyChange: -0.31 });
  const air = await position(pea.id, { symbol: 'AI', name: 'Air Liquide', quantity: 28, avgPrice: 148, currentPrice: 171.6, assetClass: 'stocks', sector: 'industry', region: 'france', dailyChange: 0.65 });
  const aapl = await position(cto.id, { symbol: 'AAPL', name: 'Apple', quantity: 45, avgPrice: 151, currentPrice: 208.2, assetClass: 'stocks', sector: 'technology', region: 'us', dailyChange: 1.12 });
  await position(cto.id, { symbol: 'IEAC', name: 'iShares Core EUR Corp Bond', quantity: 165, avgPrice: 118, currentPrice: 121.3, assetClass: 'bonds', sector: 'bonds', region: 'europe', dailyChange: 0.04 });
  await position(crypto.id, { symbol: 'BTC', name: 'Bitcoin', quantity: 0.14, avgPrice: 41_000, currentPrice: 68_000, assetClass: 'crypto', sector: 'crypto', region: 'world', dailyChange: 2.1 });
  await position(crypto.id, { symbol: 'ETH', name: 'Ethereum', quantity: 1.1, avgPrice: 2_200, currentPrice: 2_800, assetClass: 'crypto', sector: 'crypto', region: 'world', dailyChange: 1.4 });

  await prisma.fee.createMany({
    data: [
      { accountId: pea.id, accountName: peaName, type: 'transaction', label: await l('brokerage'), amount: 186, percentage: 0.5, frequency: 'annual', suggestion: await l('brokerageHint'), alternativeFee: 0.2, isManual: true },
      { accountId: cto.id, accountName: ctoName, type: 'custody', label: await l('custody'), amount: 94, percentage: 0.3, frequency: 'annual', suggestion: await l('custodyHint'), alternativeFee: 0, isManual: true },
      { accountId: cto.id, accountName: ctoName, type: 'exchange', label: await l('fxFee'), amount: 62, percentage: 0.25, frequency: 'annual', isManual: true },
    ],
  });

  const dividend = (h: { id: string; symbol: string; name: string }, amount: number, n: number, status: string, frequency: string) =>
    prisma.dividend.create({ data: { holdingId: h.id, symbol: h.symbol, name: h.name, amount, currency: 'EUR', exDate: iso(dayAgo(n + 3)), payDate: iso(dayAgo(n)), status, frequency, isManual: true } });
  for (const [i, n] of [300, 210, 120, 30].entries()) await dividend({ id: tte.id, symbol: 'TTE', name: 'TotalEnergies' }, 112 + i * 2, n, 'paid', 'quarterly');
  await dividend({ id: tte.id, symbol: 'TTE', name: 'TotalEnergies' }, 118, -18, 'confirmed', 'quarterly');
  await dividend({ id: air.id, symbol: 'AI', name: 'Air Liquide' }, 92, 190, 'paid', 'annual');
  await dividend({ id: aapl.id, symbol: 'AAPL', name: 'Apple' }, 10.5, 55, 'paid', 'quarterly');
  await dividend({ id: aapl.id, symbol: 'AAPL', name: 'Apple' }, 10.5, -35, 'projected', 'quarterly');
  void cw8;

  const CATEGORIES = [
    { name: await l('housing'), icon: 'home', color: '#5682f2', budgeted: 1150, spent: 1150 },
    { name: await l('groceries'), icon: 'cart', color: '#34d399', budgeted: 520, spent: 486 },
    { name: await l('transport'), icon: 'car', color: '#f4be7e', budgeted: 180, spent: 164 },
    { name: await l('goingOut'), icon: 'party', color: '#ec4899', budgeted: 250, spent: 312 },
    { name: await l('subscriptions'), icon: 'repeat', color: '#a78bfa', budgeted: 85, spent: 79 },
  ];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const wobble = 1 + ((i * 37) % 11 - 5) / 100;
    const categories = CATEGORIES.map((c) => ({ ...c, spent: Math.round(c.spent * (c.icon === 'home' ? 1 : wobble)) }));
    const expenses = categories.reduce((s, c) => s + c.spent, 0);
    const income = 4_450;
    await prisma.monthlyBudget.create({
      data: { userId, month, income, expenses, savings: income - expenses, categories: { create: categories } },
    });
  }

  // Five years of month-end points leading up to today's figure, with a realistic dip.
  const net = 58_240 + 31_480 + 22_950 + 4_310 + 46_700 + 12_600 + 285_000 - 168_400;
  const points: { userId: string; date: string; value: number }[] = [];
  for (let m = 60; m >= 1; m--) {
    const progress = (60 - m) / 60;
    const wave = Math.sin(progress * 9) * 0.018 + (progress > 0.25 && progress < 0.33 ? -0.05 : 0);
    points.push({ userId, date: iso(new Date(now.getFullYear(), now.getMonth() - m, 28)), value: Math.round(net * (0.46 + 0.54 * progress + wave)) });
  }
  points.push({ userId, date: iso(dayAgo(7)), value: Math.round(net * 0.992) });
  points.push({ userId, date: iso(now), value: net });
  await prisma.performancePoint.createMany({ data: points, skipDuplicates: true });
}
