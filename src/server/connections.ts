import { createHash, randomBytes } from 'node:crypto';
import { listConnectors } from '@/connectors/registry';
import { translate } from './i18n';

export const hashState = (state: string) => createHash('sha256').update(state).digest('hex');
export const newState = () => randomBytes(32).toString('base64url');

/** Which providers this user sees, and whether each can actually be used yet. */
export function availableProviders(isDemo: boolean) {
  const sandboxAllowed = isDemo || process.env.ENABLE_SANDBOX === '1';
  return listConnectors()
    .filter((c) => c.slug !== 'sandbox' || sandboxAllowed)
    .map((c) => ({ slug: c.slug, name: c.displayName, region: c.region, configured: c.isConfigured(), kind: c.slug === 'binance' || c.slug === 'ibkr' ? 'api_key' : 'redirect' }));
}

/** The same list with names and regions in the reader's language. */
export async function localizedProviders(isDemo: boolean) {
  return Promise.all(availableProviders(isDemo).map(async (p) => ({
    ...p,
    name: await translate(`server.provider.${p.slug}.name`),
    region: await translate(`server.provider.${p.slug}.region`),
  })));
}

export const appOrigin = () => (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
