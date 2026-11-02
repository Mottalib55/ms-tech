// Everything legal about the publisher lives here. Empty fields are simply not
// displayed: nothing is invented. Fill them before going public.
export const COMPANY = {
  name: 'Radif Partners',
  legalForm: '',
  capital: '',
  registration: '', // RCS / SIREN
  vat: '',
  address: '',
  director: '', // directeur de la publication
  contact: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
};

export const LAST_UPDATE = '2 novembre 2026';
