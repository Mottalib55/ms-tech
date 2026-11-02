import { getTranslations } from 'next-intl/server';
import { COMPANY } from './company';

/** How to reach the publisher: the address if one is set, the app otherwise. */
export default async function Contact({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  return COMPANY.contact
    ? <a href={`mailto:${COMPANY.contact}`} dir="ltr">{COMPANY.contact}</a>
    : <>{t('contactFallback')}</>;
}
