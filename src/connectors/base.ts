import type {
  ProviderConnector,
  ProviderSlug,
  ConnectionInitResult,
  CallbackResult,
  SyncResult,
  SyncCredentials,
} from './types';
import { connectorError } from './errors';

export abstract class BaseConnector implements ProviderConnector {
  abstract readonly slug: ProviderSlug;
  abstract readonly displayName: string;
  abstract readonly region: string;

  abstract isConfigured(): boolean;
  abstract initiateConnection(userId: string, callbackUrl: string, state: string): Promise<ConnectionInitResult>;
  abstract handleCallback(params: Record<string, string>): Promise<CallbackResult>;
  abstract sync(credentials: SyncCredentials): Promise<SyncResult>;
  abstract refreshCredentials(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;

  verifyWebhook(_body: string, _signature: string): boolean {
    return false;
  }

  protected async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      signal: options?.signal ?? AbortSignal.timeout(20_000),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Provider bodies can echo identifiers: log them, do not store or show them.
      const text = await response.text().catch(() => '');
      console.error(`[${this.slug}] ${response.status} ${url.split('?')[0]}: ${text.slice(0, 500)}`);
      throw connectorError('http', { provider: this.displayName, status: response.status });
    }

    return response.json() as Promise<T>;
  }
}
