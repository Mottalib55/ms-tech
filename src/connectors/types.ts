export type ProviderSlug = 'powens' | 'lean' | 'saltedge' | 'binance' | 'ibkr' | 'sandbox';

export interface NormalizedAccount {
  externalId: string;
  name: string;
  institution: string;
  type: string;
  balance: number;
  currency: string;
  color?: string;
}

export interface NormalizedHolding {
  externalId: string;
  accountExternalId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  currency: string;
  assetClass: string;
  sector: string;
  region: string;
  dailyChange: number;
}

export interface NormalizedFee {
  accountExternalId: string;
  accountName: string;
  type: string;
  label: string;
  amount: number;
  percentage: number;
  frequency: string;
  suggestion?: string;
  alternativeFee?: number;
}

export interface NormalizedDividend {
  holdingExternalId: string;
  symbol: string;
  name: string;
  amount: number;
  currency: string;
  exDate: string;
  payDate: string;
  status: string;
  frequency: string;
}

export interface NormalizedTransaction {
  externalId: string;
  accountExternalId: string;
  type: string;
  symbol?: string;
  name?: string;
  quantity?: number;
  price?: number;
  amount: number;
  currency: string;
  date: Date;
  description?: string;
}

export interface SyncResult {
  accounts: NormalizedAccount[];
  holdings: NormalizedHolding[];
  fees: NormalizedFee[];
  dividends: NormalizedDividend[];
  transactions: NormalizedTransaction[];
}

export interface ConnectionInitResult {
  type: 'redirect' | 'widget' | 'api_key';
  redirectUrl?: string;
  widgetUrl?: string;
  connectionId?: string;
}

export interface CallbackResult {
  externalId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface SyncCredentials {
  accessToken: string;
  /** Second half of an API-key pair (Binance). */
  apiSecret?: string;
  /** The provider's id for this connection, when distinct from the token. */
  externalId?: string;
  /** The account's language, for the rare texts a connector writes itself (the demo bank). */
  locale?: string;
}

export interface ProviderConnector {
  readonly slug: ProviderSlug;
  readonly displayName: string;
  readonly region: string;

  /** False until the deployment holds this provider's keys: the UI then says so. */
  isConfigured(): boolean;
  /** `state` is opaque and must come back on the callback URL. */
  initiateConnection(userId: string, callbackUrl: string, state: string): Promise<ConnectionInitResult>;
  handleCallback(params: Record<string, string>): Promise<CallbackResult>;
  sync(credentials: SyncCredentials): Promise<SyncResult>;
  refreshCredentials(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;
  verifyWebhook(body: string, signature: string): boolean;
}
