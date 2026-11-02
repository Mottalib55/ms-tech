import { intlLocale } from '@/i18n/format';

// Everything legal about the publisher lives here. Empty fields are simply not
// displayed: nothing is invented. Fill them before going public.
export const COMPANY = {
  name: 'Radif Partners',
  legalForm: '',
  capital: '',
  registration: '', // RCS / SIREN
  vat: '',
  address: '',
  director: '', // publication director
  contact: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
};

export const lastUpdate = (locale: string) =>
  new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date('2026-11-02T12:00:00Z'));
