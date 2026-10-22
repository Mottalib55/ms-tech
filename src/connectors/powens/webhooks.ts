import { createHmac } from 'crypto';

const POWENS_WEBHOOK_SECRET = process.env.POWENS_WEBHOOK_SECRET || '';

export function verifyPowensWebhook(body: string, signature: string): boolean {
  if (!POWENS_WEBHOOK_SECRET) {
    console.warn('POWENS_WEBHOOK_SECRET not configured, skipping verification');
    return false;
  }

  const expected = createHmac('sha256', POWENS_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return expected === signature;
}

export interface PowensWebhookPayload {
  id: number;
  id_user: number;
  id_connection: number;
  state: string;
  last_update?: string;
  error?: string;
  error_message?: string;
}

export function parsePowensWebhook(body: string): PowensWebhookPayload {
  return JSON.parse(body) as PowensWebhookPayload;
}
