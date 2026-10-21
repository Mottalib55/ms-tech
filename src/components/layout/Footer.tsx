import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0b] border-t border-[rgba(255,255,255,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-gradient-to-br from-[#d4a06a] via-[#f4be7e] to-[#f9d09f] shadow-[0_0_16px_rgba(244,190,126,0.3)]">
                <span className="text-[#0a0a0b] font-bold text-sm">MS</span>
              </div>
              <span className="text-lg font-bold text-[#f5f5f5]">MS Tech</span>
            </div>
            <p className="text-sm text-[#6b6b73]">
              Votre patrimoine, simplifié. Une solution par Market Securities.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#f5f5f5] mb-3">Produit</h4>
            <ul className="space-y-2 text-sm text-[#6b6b73]">
              <li><Link href="#features" className="hover:text-[#f4be7e] transition-colors duration-200">Fonctionnalités</Link></li>
              <li><Link href="#" className="hover:text-[#f4be7e] transition-colors duration-200">Tarifs</Link></li>
              <li><Link href="#" className="hover:text-[#f4be7e] transition-colors duration-200">Sécurité</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#f5f5f5] mb-3">Entreprise</h4>
            <ul className="space-y-2 text-sm text-[#6b6b73]">
              <li><Link href="#" className="hover:text-[#f4be7e] transition-colors duration-200">À propos</Link></li>
              <li><Link href="#" className="hover:text-[#f4be7e] transition-colors duration-200">Market Securities</Link></li>
              <li><Link href="#" className="hover:text-[#f4be7e] transition-colors duration-200">Carrières</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#f5f5f5] mb-3">Légal</h4>
            <ul className="space-y-2 text-sm text-[#6b6b73]">
              <li><Link href="#" className="hover:text-[#f4be7e] transition-colors duration-200">Mentions légales</Link></li>
              <li><Link href="#" className="hover:text-[#f4be7e] transition-colors duration-200">CGU</Link></li>
              <li><Link href="#" className="hover:text-[#f4be7e] transition-colors duration-200">Politique de confidentialité</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[rgba(255,255,255,0.04)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#6b6b73]">
            &copy; 2025 MS Tech — Market Securities. Tous droits réservés.
          </p>
          <div className="h-px w-16 bg-gradient-to-r from-[#5682f2] to-[#f4be7e] rounded-full hidden sm:block" />
          <p className="text-xs text-[#6b6b73]/60">
            Les performances passées ne préjugent pas des performances futures.
          </p>
        </div>
      </div>
    </footer>
  );
}
