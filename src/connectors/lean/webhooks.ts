import { createHmac } from 'node:crypto';
import { safeEqual } from '../signing';

/**
 * https://docs.leantech.me/docs/webhooks
 * Header `lean-signature`: "sha512=" + hex(HMAC-SHA512(raw body, webhook secret)).
 */
export function verifyLeanWebhook(body: string, signature: string): boolean {
  const secret = process.env.LEAN_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = `sha512=${createHmac('sha512', secret).update(body).digest('hex')}`;
  return safeEqual(expected, signature);
}

export interface LeanWebhookPayload {
  type: string;
  message?: string;
  payload?: { id?: string; entity_id?: string; customer_id?: string; status?: string };
}

export function parseLeanWebhook(body: string): LeanWebhookPayload {
  return JSON.parse(body) as LeanWebhookPayload;
}
