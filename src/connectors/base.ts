import type {
  ProviderConnector,
  ProviderSlug,
  ConnectionInitResult,
  CallbackResult,
  SyncResult,
} from './types';

export abstract class BaseConnector implements ProviderConnector {
  abstract readonly slug: ProviderSlug;
  abstract readonly displayName: string;
  abstract readonly region: string;

  abstract initiateConnection(userId: string, callbackUrl: string): Promise<ConnectionInitResult>;
  abstract handleCallback(params: Record<string, string>): Promise<CallbackResult>;
  abstract sync(accessToken: string, refreshToken?: string): Promise<SyncResult>;
  abstract refreshCredentials(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;

  verifyWebhook(_body: string, _signature: string): boolean {
    return false;
  }

  protected async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      throw new Error(`${this.slug} API error ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
  }
}
