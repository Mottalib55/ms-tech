import { COMPANY } from './company';

/** How to reach the publisher: the address if one is set, the app otherwise. */
export default function Contact() {
  return COMPANY.contact
    ? <a href={`mailto:${COMPANY.contact}`}>{COMPANY.contact}</a>
    : <>depuis les paramètres de votre compte (export et suppression y sont en libre-service)</>;
}
