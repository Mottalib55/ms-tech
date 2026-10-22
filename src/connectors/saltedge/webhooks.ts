import { createHmac } from 'crypto';

const SALTEDGE_WEBHOOK_SECRET = process.env.SALTEDGE_WEBHOOK_SECRET || '';

export function verifySaltEdgeWebhook(body: string, signature: string): boolean {
  if (!SALTEDGE_WEBHOOK_SECRET) return false;
  const expected = createHmac('sha256', SALTEDGE_WEBHOOK_SECRET).update(body).digest('hex');
  return expected === signature;
}

export interface SaltEdgeWebhookPayload {
  data: {
    connection_id: string;
    customer_id: string;
    custom_fields?: Record<string, string>;
    stage: string;
  };
  meta: { version: string; time: string };
}

export function parseSaltEdgeWebhook(body: string): SaltEdgeWebhookPayload {
  return JSON.parse(body) as SaltEdgeWebhookPayload;
}
