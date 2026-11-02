import type { Metadata } from 'next';
import { COMPANY, LAST_UPDATE } from '../company';
import Contact from '../Contact';

export const metadata: Metadata = { title: 'Politique de confidentialité' };

const PROCESSORS: [string, string][] = [
  ['Vercel', 'hébergement de l\'application'],
  ['Powens, Salt Edge, Lean Technologies', 'agrégation bancaire, si vous reliez une banque'],
  ['Binance, Interactive Brokers', 'lecture de vos soldes et positions, si vous les connectez'],
  ['CoinGecko', 'cours des cryptomonnaies : ne reçoit que des noms d\'actifs, aucune donnée personnelle'],
  ['Frankfurter (cours de la BCE)', 'taux de change : ne reçoit aucune donnée personnelle'],
  ['Resend', 'envoi du courriel de réinitialisation de mot de passe (votre adresse)'],
];

export default function PrivacyPage() {
  return (
    <>
      <h1>Politique de confidentialité</h1>
      <p className="text-sm text-[#8e8e98]">Dernière mise à jour : {LAST_UPDATE}</p>
      <h2>Responsable du traitement</h2>
      <p>{COMPANY.name}. Contact : <Contact />.</p>
      <h2>Données traitées</h2>
      <ul>
        <li><strong>Compte</strong> : nom, adresse e-mail, mot de passe sous forme hachée (bcrypt), devise choisie.</li>
        <li><strong>Données financières</strong> : comptes, soldes, positions, opérations, frais, dividendes, budgets et historique de votre patrimoine net, saisis par vous ou reçus de vos connexions.</li>
        <li><strong>Accès aux fournisseurs</strong> : jetons et clés d&apos;API, chiffrés au repos (AES-256-GCM). Vos identifiants bancaires ne nous sont jamais transmis.</li>
        <li><strong>Technique</strong> : les cookies strictement nécessaires à la connexion, et des journaux d&apos;erreurs serveur.</li>
      </ul>
      <p>Aucune publicité, aucun outil de mesure d&apos;audience, aucun service Google. Vos données ne sont ni vendues ni utilisées à d&apos;autres fins que de vous fournir le service.</p>
      <h2>Finalités et bases légales</h2>
      <ul>
        <li>Fournir le service que vous demandez : exécution du contrat (CGU).</li>
        <li>Accéder à vos comptes auprès d&apos;un fournisseur : votre consentement, retirable à tout moment en le déconnectant.</li>
        <li>Sécuriser le service (limitation des tentatives, journaux) : intérêt légitime.</li>
      </ul>
      <h2>Destinataires</h2>
      <ul>{PROCESSORS.map(([n, d]) => <li key={n}><strong>{n}</strong> : {d}.</li>)}</ul>
      <p>Certains prestataires peuvent traiter des données hors de l&apos;Union européenne, sous les garanties prévues par le RGPD (clauses contractuelles types ou décision d&apos;adéquation).</p>
      <h2>Agrégation bancaire</h2>
      <p>L&apos;agrégation bancaire passe par des prestataires agréés pour le service d&apos;information sur les comptes. L&apos;accès est en lecture seule : MS Tech ne peut ni déplacer d&apos;argent ni passer d&apos;ordre.</p>
      <h2>Durée de conservation</h2>
      <p>Vos données sont conservées jusqu&apos;à la suppression de votre compte, qui les efface immédiatement, connexions comprises. Les comptes de démonstration sont effacés sous 24 heures.</p>
      <h2>Vos droits</h2>
      <p>Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de portabilité. Dans Paramètres, vous pouvez à tout moment modifier votre profil, <strong>exporter vos données</strong> et <strong>supprimer votre compte</strong>. Pour toute autre demande : <Contact />. Vous pouvez aussi saisir la CNIL (cnil.fr).</p>
      <h2>Sécurité</h2>
      <p>Connexions chiffrées (HTTPS), mots de passe hachés, jetons chiffrés au repos, limitation des tentatives de connexion, déconnexion des autres appareils lors d&apos;un changement de mot de passe.</p>
    </>
  );
}
