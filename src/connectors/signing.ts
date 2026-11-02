import { createHmac, timingSafeEqual } from 'node:crypto';

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Seals values we put on a provider's return URL. The callback only receives
 * query parameters, so without this a signed-in user could swap in someone
 * else's customer or connection id and have their accounts imported.
 */
export function seal(value: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is required');
  return createHmac('sha256', key).update(value).digest('base64url');
}

export function sealOk(value: string, sig: string | undefined): boolean {
  return !!sig && safeEqual(seal(value), sig);
}

export function withQuery(url: string, params: Record<string, string>): string {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
