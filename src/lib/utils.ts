type Lang = 'fr' | 'en' | 'ar';
// Western digits in Arabic: the UAE convention for finance, and what a statement shows.
const FORMAT_LOCALES: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-AE-u-nu-latn' };
let current: Lang = 'en';
const lang = () => current;
const loc = () => FORMAT_LOCALES[current];

/**
 * Set while rendering by LocaleProvider, so that every number and date below follows the page.
 * Module state: figures from the API are only formatted in the browser, where there is one language.
 */
export function setFormatLocale(locale: string) {
  if (locale === 'fr' || locale === 'en' || locale === 'ar') current = locale;
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat(loc(), { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatCurrencyDetailed(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat(loc(), { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const text = new Intl.NumberFormat(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return `${value >= 0 ? '+' : ''}${text}${current === 'fr' ? ' %' : '%'}`;
}

export function formatCompact(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat(loc(), { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatAxisMonth(date: string | number): string {
  return new Date(date).toLocaleDateString(loc(), { month: 'short', year: '2-digit' });
}

export function formatDate(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonth(month: string): string {
  const d = new Date(`${month}-15`);
  return Number.isNaN(d.getTime()) ? month : d.toLocaleDateString(loc(), { month: 'short', year: 'numeric' });
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  const none = { fr: 'Jamais', en: 'Never', ar: 'أبدًا' }[lang()];
  if (!dateString) return none;
  const diffMin = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(loc(), { numeric: 'auto', style: 'short' });
  if (diffMin < 1) return rtf.format(0, 'second');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  const h = Math.floor(diffMin / 60);
  if (h < 24) return rtf.format(-h, 'hour');
  const d = Math.floor(h / 24);
  return d < 30 ? rtf.format(-d, 'day') : formatDate(dateString);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** "1 234,50", "1,234.50" or Arabic digits, as typed; NaN when it is not a number. */
export function parseAmount(text: string): number {
  // Arabic keyboards type their own digits and separators.
  let t = text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/٫/g, '.').replace(/٬/g, ',')
    .replace(/[\s\u00a0\u202f']/g, '');
  if (t === '') return NaN;
  const comma = t.lastIndexOf(',');
  const dot = t.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    // "1,234.50" and "1.234,50": the last separator is the decimal one.
    t = comma > dot ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  } else if (comma >= 0) {
    // "1,234,567" groups thousands. "1,234" does too in English, but is 1.234 in French.
    const grouped = t.indexOf(',') !== comma || (current !== 'fr' && /^-?\d{1,3},\d{3}$/.test(t));
    t = grouped ? t.replace(/,/g, '') : t.replace(',', '.');
  } else if (dot >= 0 && t.indexOf('.') !== dot) {
    t = t.replace(/\./g, '');
  }
  return Number(t);
}

/** A number typed back into an input, with the decimal mark of the page's language. */
export const toInputNumber = (n: number) => (current === 'fr' ? String(n).replace('.', ',') : String(n));

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(loc(), options).format(value);
}

/** "12,5 %" in French, "12.5%" elsewhere. Without a sign, unlike formatPercent. */
export function formatPct(value: number, maximumFractionDigits = 1): string {
  return `${formatNumber(value, { maximumFractionDigits })}${current === 'fr' ? ' %' : '%'}`;
}

/** An amount that always shows its direction: the sign stays attached in right-to-left text. */
export function formatCurrencySigned(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat(loc(), { style: 'currency', currency, maximumFractionDigits: 0, signDisplay: 'exceptZero' }).format(Number.isFinite(amount) ? amount : 0);
}
