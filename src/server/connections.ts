import { createHash, randomBytes } from 'node:crypto';
import { listConnectors } from '@/connectors/registry';

export const hashState = (state: string) => createHash('sha256').update(state).digest('hex');
export const newState = () => randomBytes(32).toString('base64url');

/** Which providers this user sees, and whether each can actually be used yet. */
export function availableProviders(isDemo: boolean) {
  const sandboxAllowed = isDemo || process.env.ENABLE_SANDBOX === '1';
  return listConnectors()
    .filter((c) => c.slug !== 'sandbox' || sandboxAllowed)
    .map((c) => ({ slug: c.slug, name: c.displayName, region: c.region, configured: c.isConfigured(), kind: c.slug === 'binance' || c.slug === 'ibkr' ? 'api_key' : 'redirect' }));
}

export const appOrigin = () => (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
