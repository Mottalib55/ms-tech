import type { Metadata } from 'next';
import { COMPANY, LAST_UPDATE } from '../company';
import Contact from '../Contact';

export const metadata: Metadata = { title: 'Mentions légales' };

export default function MentionsPage() {
  const rows: [string, string][] = [
    ['Forme juridique', COMPANY.legalForm],
    ['Capital', COMPANY.capital],
    ['Immatriculation', COMPANY.registration],
    ['TVA intracommunautaire', COMPANY.vat],
    ['Adresse', COMPANY.address],
    ['Directeur de la publication', COMPANY.director],
  ];
  return (
    <>
      <h1>Mentions légales</h1>
      <p className="text-sm text-[#8e8e98]">Dernière mise à jour : {LAST_UPDATE}</p>
      <h2>Éditeur</h2>
      <p><strong>{COMPANY.name}</strong></p>
      <ul>{rows.filter(([, v]) => v).map(([k, v]) => <li key={k}>{k} : {v}</li>)}</ul>
      <p>Contact : <Contact />.</p>
      <h2>Hébergement</h2>
      <p>Application hébergée par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
      <h2>Nature du service</h2>
      <p>MS Tech est un service d&apos;information qui présente une vue d&apos;ensemble des données financières de l&apos;utilisateur. Il ne constitue ni un conseil en investissement, ni une recommandation personnalisée, ni un service de paiement.</p>
      <p>L&apos;agrégation bancaire passe par des prestataires agréés pour le service d&apos;information sur les comptes. MS Tech n&apos;a jamais accès à vos identifiants bancaires, saisis sur les pages de ces prestataires ou de votre banque.</p>
      <h2>Propriété intellectuelle</h2>
      <p>Les éléments de l&apos;application (textes, interface, marque) sont protégés. Toute reproduction sans autorisation est interdite.</p>
    </>
  );
}
