import { ApiError } from './http';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash when configured (shared between serverless instances); otherwise a
// per-instance window, which still stops a script hammering one instance.
const memory = new Map<string, { count: number; reset: number }>();
const limiters = new Map<string, Ratelimit>();

function upstash(limit: number, windowSeconds: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  const key = `${limit}/${windowSeconds}`;
  let rl = limiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    });
    limiters.set(key, rl);
  }
  return rl;
}

export async function hit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  if (process.env.DISABLE_RATE_LIMIT === '1') return true;
  const rl = upstash(limit, windowSeconds);
  if (rl) return (await rl.limit(key)).success;
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.reset < now) {
    if (memory.size > 5000) memory.clear();
    memory.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export async function enforce(key: string, limit: number, windowSeconds: number) {
  if (!(await hit(key, limit, windowSeconds))) {
    throw new ApiError(429, 'Trop de tentatives. Patientez un instant puis réessayez.');
  }
}

export function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}
