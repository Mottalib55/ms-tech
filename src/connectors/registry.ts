import type { ProviderConnector, ProviderSlug } from './types';

const connectors = new Map<ProviderSlug, () => ProviderConnector>();

export function registerConnector(slug: ProviderSlug, factory: () => ProviderConnector) {
  connectors.set(slug, factory);
}

export function getConnector(slug: ProviderSlug): ProviderConnector {
  const factory = connectors.get(slug);
  if (!factory) {
    throw new Error(`Unknown provider: ${slug}`);
  }
  return factory();
}

export function listConnectors(): ProviderSlug[] {
  return Array.from(connectors.keys());
}

// Lazy registration — each connector registers itself when imported
import('./powens/client').catch(() => {});
import('./lean/client').catch(() => {});
import('./saltedge/client').catch(() => {});
import('./coingecko/client').catch(() => {});
import('./binance/client').catch(() => {});
import('./ibkr/client').catch(() => {});
