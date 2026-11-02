import type { Metadata } from 'next';
import { COMPANY, LAST_UPDATE } from '../company';
import Contact from '../Contact';

export const metadata: Metadata = { title: 'Conditions générales d\'utilisation' };

export default function TermsPage() {
  return (
    <>
      <h1>Conditions générales d&apos;utilisation</h1>
      <p className="text-sm text-[#8e8e98]">Dernière mise à jour : {LAST_UPDATE}</p>
      <h2>1. Objet</h2>
      <p>Les présentes conditions régissent l&apos;utilisation de MS Tech, édité par {COMPANY.name}. Créer un compte vaut acceptation.</p>
      <h2>2. Service</h2>
      <p>MS Tech vous permet de rassembler vos comptes, saisis à la main ou reliés à des fournisseurs tiers, et de consulter patrimoine net, répartition, frais, dividendes, budget, projections et simulations.</p>
      <h2>3. Pas de conseil en investissement</h2>
      <p>MS Tech est un service d&apos;information. Aucun contenu ne constitue un conseil en investissement, une recommandation personnalisée, ni un conseil fiscal ou juridique. Projections et simulations reposent sur des hypothèses que vous choisissez et n&apos;annoncent aucun résultat. Investir comporte un risque de perte en capital ; vos décisions vous appartiennent.</p>
      <h2>4. Exactitude des données</h2>
      <p>Les montants proviennent de vos saisies et de fournisseurs tiers. Ils peuvent être incomplets ou décalés, notamment en cas de panne d&apos;un fournisseur. Les conversions de devises utilisent des cours indicatifs. Seuls les relevés de vos établissements font foi.</p>
      <h2>5. Votre compte</h2>
      <p>Vous êtes responsable de la confidentialité de votre mot de passe et des clés d&apos;API que vous confiez au service. Pour une plateforme à clés (Binance), créez une clé en lecture seule, sans droit de retrait ni de trading.</p>
      <h2>6. Connexions</h2>
      <p>Vous autorisez l&apos;accès en lecture à vos données auprès de chaque fournisseur que vous connectez. Vous pouvez retirer cet accès à tout moment depuis la page Connexions : les comptes concernés quittent alors votre patrimoine.</p>
      <h2>7. Disponibilité</h2>
      <p>Nous nous efforçons de maintenir le service accessible, sans garantie d&apos;absence d&apos;interruption. Le service peut évoluer.</p>
      <h2>8. Responsabilité</h2>
      <p>Dans les limites permises par la loi, {COMPANY.name} ne répond pas des décisions prises sur la base des informations affichées, ni des pannes de fournisseurs tiers. Rien ici ne limite vos droits de consommateur.</p>
      <h2>9. Résiliation</h2>
      <p>Vous pouvez supprimer votre compte à tout moment dans Paramètres. La suppression est immédiate et efface vos données. Nous pouvons suspendre un compte en cas d&apos;usage frauduleux ou abusif.</p>
      <h2>10. Droit applicable</h2>
      <p>Ces conditions sont soumises au droit français. En cas de litige, vous pouvez recourir à la médiation de la consommation ou saisir les tribunaux compétents.</p>
      <h2>Contact</h2>
      <p><Contact />.</p>
    </>
  );
}
