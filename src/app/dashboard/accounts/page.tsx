'use client';

import { useState } from 'react';
import {
  Plus,
  RefreshCw,
  Building2,
  Landmark,
  Bitcoin,
  Home,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { mockAccounts } from '@/data/mock';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

const accountIcons: Record<string, typeof Building2> = {
  brokerage: Building2,
  bank: Landmark,
  crypto: Bitcoin,
  'real-estate': Home,
  insurance: Shield,
};

const statusConfig = {
  connected: { label: 'Connecté', variant: 'success' as const, icon: CheckCircle2 },
  error: { label: 'Erreur', variant: 'danger' as const, icon: AlertCircle },
  pending: { label: 'En attente', variant: 'warning' as const, icon: Clock },
};

export default function AccountsPage() {
  const [showModal, setShowModal] = useState(false);
  const totalBalance = mockAccounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Comptes connectés</h1>
          <p className="text-[#a0a0a6] text-sm mt-1">{mockAccounts.length} comptes &middot; {formatCurrency(totalBalance)} au total</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-2" />
          Ajouter un compte
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockAccounts.map((account, i) => {
          const Icon = accountIcons[account.type] || Building2;
          const status = statusConfig[account.status];
          const StatusIcon = status.icon;
          return (
            <Card key={account.id} interactive className={`animate-in animate-in-${Math.min(i + 1, 8)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                    style={{ backgroundColor: `${account.color}15` }}
                  >
                    <Icon size={20} style={{ color: account.color }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#f5f5f5] text-sm">{account.name}</h3>
                    <p className="text-xs text-[#6b6b73]">{account.institution}</p>
                  </div>
                </div>
                <Badge variant={status.variant}>
                  <StatusIcon size={12} className="mr-1" />
                  {status.label}
                </Badge>
              </div>

              <div className="text-2xl font-bold text-[#f5f5f5] mb-1">
                <AnimatedNumber value={account.balance} format={(n) => formatCurrency(n)} delay={i * 80} />
              </div>

              <div className="flex items-center justify-between text-xs text-[#6b6b73] mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                <span>Dernière sync : {formatRelativeTime(account.lastSync)}</span>
                <button className="flex items-center gap-1 text-[#6b6b73] hover:text-[#f4be7e] transition-colors duration-200">
                  <RefreshCw size={12} />
                  Sync
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Ajouter un compte">
        <div className="space-y-3">
          {[
            { name: 'Market Securities', type: 'PEA / CTO' },
            { name: 'Boursorama', type: 'Banque / PEA' },
            { name: 'Interactive Brokers', type: 'CTO' },
            { name: 'Binance', type: 'Crypto' },
            { name: 'Linxea', type: 'Assurance Vie' },
          ].map((inst) => (
            <button
              key={inst.name}
              className="w-full flex items-center justify-between p-3 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.06)] rounded-[12px] transition-colors duration-200"
              onClick={() => setShowModal(false)}
            >
              <div className="text-left">
                <div className="text-sm font-medium text-[#f5f5f5]">{inst.name}</div>
                <div className="text-xs text-[#6b6b73]">{inst.type}</div>
              </div>
              <Plus size={16} className="text-[#6b6b73]" />
            </button>
          ))}
        </div>
        <p className="text-xs text-[#6b6b73] mt-4 text-center">
          Connexion sécurisée en lecture seule
        </p>
      </Modal>
    </div>
  );
}
