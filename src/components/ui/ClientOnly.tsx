'use client';

import { type ReactNode, useSyncExternalStore } from 'react';

const never = () => () => {};

/**
 * For screens that compute figures from their initial state, without waiting for the API. Node and
 * Safari do not format numbers identically, so rendering them on the server breaks hydration.
 */
export default function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const mounted = useSyncExternalStore(never, () => true, () => false);
  return <>{mounted ? children : fallback}</>;
}
