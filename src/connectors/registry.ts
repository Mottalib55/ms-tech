import type { ProviderConnector, ProviderSlug } from './types';
import powens from './powens/client';
import lean from './lean/client';
import saltedge from './saltedge/client';
import binance from './binance/client';
import ibkr from './ibkr/client';
import sandbox from './sandbox/client';

// Explicit, not lazy: the previous fire-and-forget imports raced the first
// request and answered "Unknown provider".
const connectors: Record<ProviderSlug, ProviderConnector> = { powens, lean, saltedge, binance, ibkr, sandbox };

export function getConnector(slug: ProviderSlug): ProviderConnector {
  const connector = connectors[slug];
  if (!connector) throw new Error(`Unknown provider: ${slug}`);
  return connector;
}

export const listConnectors = () => Object.values(connectors);
