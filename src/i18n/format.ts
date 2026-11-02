const FORMAT_LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-AE-u-nu-latn' };

/** For server components: Intl locale of a page language, with Western digits in Arabic. */
export const intlLocale = (locale: string) => FORMAT_LOCALES[locale] ?? 'en-GB';
