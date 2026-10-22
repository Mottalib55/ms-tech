export interface LeanWebhookPayload {
  type: string;
  entity_id: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export function parseLeanWebhook(body: string): LeanWebhookPayload {
  return JSON.parse(body) as LeanWebhookPayload;
}
