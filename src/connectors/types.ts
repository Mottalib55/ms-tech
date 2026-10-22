export type ProviderSlug = 'powens' | 'lean' | 'saltedge' | 'coingecko' | 'binance' | 'ibkr';

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

export interface ProviderConnector {
  readonly slug: ProviderSlug;
  readonly displayName: string;
  readonly region: string;

  initiateConnection(userId: string, callbackUrl: string): Promise<ConnectionInitResult>;
  handleCallback(params: Record<string, string>): Promise<CallbackResult>;
  sync(accessToken: string, refreshToken?: string): Promise<SyncResult>;
  refreshCredentials(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;
  verifyWebhook(body: string, signature: string): boolean;
}
