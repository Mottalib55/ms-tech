import { cookies, headers } from 'next/headers';
import { createTranslator } from 'next-intl';
import { LOCALES, routing, type Locale } from '@/i18n/routing';
import { loadMessages } from '@/i18n/messages';

type Values = Record<string, string | number>;

/**
 * The language of the request. next-intl only writes its cookie when the page's language differs
 * from the device's, so no cookie means the device's language is the page's.
 */
export async function requestLocale(): Promise<Locale> {
  const known = (l?: string): l is Locale => (LOCALES as readonly string[]).includes(l ?? '');
  const cookie = (await cookies()).get('NEXT_LOCALE')?.value;
  if (known(cookie)) return cookie;
  const accept = (await headers()).get('accept-language') ?? '';
  const ranked = accept.split(',')
    .map((part) => { const [tag, q] = part.trim().split(';q='); return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 }; })
    .sort((a, b) => b.q - a.q);
  return ranked.map((r) => r.lang).find(known) ?? routing.defaultLocale;
}

/**
 * Server text in the reader's language. Keys read "errors.sessionExpired" or "server.mail.subject";
 * anything that is not a known key (a provider's own message, say) comes back unchanged.
 * `locale` is required outside a request (cron, webhooks): there are no cookies to read.
 */
export async function translate(key: string, values?: Values, locale?: Locale): Promise<string> {
  // Stored connector errors carry their values: "errors.connector.http|{"status":500}".
  const bar = key.indexOf('|');
  const name = bar < 0 ? key : key.slice(0, bar);
  if (!/^[a-z]+\.[\w.-]+$/i.test(name)) return key;
  let stored: Values | undefined;
  try {
    stored = bar < 0 ? undefined : (JSON.parse(key.slice(bar + 1)) as Values);
  } catch {
    return key; // A provider's own text that merely looks like a key.
  }
  const lang = locale ?? (await requestLocale());
  const messages = await loadMessages(lang);
  const t = createTranslator({ locale: lang, messages });
  const k = name as Parameters<typeof t>[0];
  return t.has(k) ? t(k, { ...stored, ...values } as never) : key;
}
