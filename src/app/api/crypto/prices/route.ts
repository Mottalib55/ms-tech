import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || '';
const COINGECKO_BASE_URL = COINGECKO_API_KEY
  ? 'https://pro-api.coingecko.com/api/v3'
  : 'https://api.coingecko.com/api/v3';

// Simple in-memory cache with 60s TTL
let cachedPrices: { data: Record<string, { usd: number; eur: number }>; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

const DEFAULT_COINS = 'bitcoin,ethereum,binancecoin,solana,cardano,polkadot,avalanche-2,chainlink,uniswap,aave';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const coins = searchParams.get('ids') || DEFAULT_COINS;

    // Return cached data if fresh
    if (cachedPrices && Date.now() - cachedPrices.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedPrices.data);
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (COINGECKO_API_KEY) {
      headers['x-cg-pro-api-key'] = COINGECKO_API_KEY;
    }

    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=${coins}&vs_currencies=usd,eur&include_24hr_change=true`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Update cache
    cachedPrices = { data, timestamp: Date.now() };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);

    // Return stale cache if available
    if (cachedPrices) {
      return NextResponse.json(cachedPrices.data);
    }

    return NextResponse.json(
      { error: 'Failed to fetch crypto prices' },
      { status: 500 }
    );
  }
}
