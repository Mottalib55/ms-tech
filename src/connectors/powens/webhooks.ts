import { createHmac } from 'node:crypto';
import { safeEqual } from '../signing';

/**
 * https://docs.powens.com/documentation/integration-guides/webhooks
 * BI-Signature = base64(HMAC-SHA256("METHOD.endpoint.date.payload", secret)), the
 * date being the BI-Signature-Date header. The secret comes once from
 * POST /webhooks/auth (type hmac_signature), linked to the webhook in the console.
 * VERIFY: on first real delivery, that `endpoint` is the path without query string.
 */
export function verifyPowensWebhook(
  body: string,
  signature: string,
  date: string,
  path: string,
  method = 'POST',
): boolean {
  const secret = process.env.POWENS_WEBHOOK_SECRET;
  if (!secret || !signature || !date) return false;
  const expected = createHmac('sha256', secret).update(`${method}.${path}.${date}.${body}`).digest('base64');
  return safeEqual(expected, signature);
}

/** CONNECTION_SYNCED carries `user` and `connection` objects plus `id_webhook_data`. */
export interface PowensWebhookPayload {
  id_webhook_data?: number;
  user?: { id: number };
  connection?: { id: number; state?: string | null; error?: string | null; error_message?: string | null };
}

export function parsePowensWebhook(body: string): PowensWebhookPayload {
  return JSON.parse(body) as PowensWebhookPayload;
}
