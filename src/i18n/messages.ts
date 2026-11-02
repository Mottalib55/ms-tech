export const NAMESPACES = [
  'common', 'nav', 'errors',
  'landing', 'auth', 'legal', 'public',
  'home', 'accounts', 'connections', 'settings', 'server',
  'portfolio', 'budget', 'dividends', 'fees', 'simulators', 'predict', 'charts', 'finance',
] as const;

/** Long texts rendered only by server components: they never go to the browser. */
export const SERVER_ONLY_NAMESPACES = ['landing', 'legal', 'server'] as const;

export async function loadMessages(locale: string) {
  const parts = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, (await import(`../../messages/${locale}/${ns}.json`)).default] as const),
  );
  return Object.fromEntries(parts) as Record<string, Record<string, unknown>>;
}
