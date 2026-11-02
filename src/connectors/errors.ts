/**
 * A connector's failure, as a translatable key: connectors run outside any request (cron, webhooks)
 * and their message is stored in lastSyncError, then translated when read (server/i18n.ts).
 */
export function connectorError(key: string, values?: Record<string, string | number>) {
  return new Error(values ? `errors.connector.${key}|${JSON.stringify(values)}` : `errors.connector.${key}`);
}

/** True when a provider answered with one of these HTTP statuses (see connectorError('http', …)). */
export const isHttpStatus = (error: unknown, ...statuses: number[]) =>
  error instanceof Error && statuses.some((status) => error.message.includes(`"status":${status}`));
