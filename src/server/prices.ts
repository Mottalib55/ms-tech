import { prisma } from './db';
import { adjustManualBalance } from './holdings';

const IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana', ADA: 'cardano', DOT: 'polkadot',
  AVAX: 'avalanche-2', LINK: 'chainlink', UNI: 'uniswap', AAVE: 'aave', XRP: 'ripple', DOGE: 'dogecoin',
  MATIC: 'matic-network', LTC: 'litecoin', ATOM: 'cosmos', USDT: 'tether', USDC: 'usd-coin',
};

export async function refreshCryptoPrices(userId: string): Promise<number> {
  const holdings = await prisma.holding.findMany({ where: { assetClass: 'crypto', account: { userId } } });
  const known = holdings.filter((h) => IDS[h.symbol]);
  if (!known.length) return 0;
  const ids = [...new Set(known.map((h) => IDS[h.symbol]))].join(',');
  const key = process.env.COINGECKO_API_KEY;
  const base = key ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
  const res = await fetch(`${base}/simple/price?ids=${ids}&vs_currencies=eur,usd&include_24hr_change=true`, {
    headers: key ? { 'x-cg-pro-api-key': key } : {},
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const prices = (await res.json()) as Record<string, Record<string, number>>;
  let updated = 0;
  for (const h of known) {
    const p = prices[IDS[h.symbol]];
    const price = p?.[h.currency.toLowerCase()];
    if (!price) continue;
    await prisma.holding.update({
      where: { id: h.id },
      data: { currentPrice: price, dailyChange: p[`${h.currency.toLowerCase()}_24h_change`] ?? h.dailyChange },
    });
    await adjustManualBalance(h.accountId, h.quantity * (price - h.currentPrice), h.currency);
    updated += 1;
  }
  return updated;
}
