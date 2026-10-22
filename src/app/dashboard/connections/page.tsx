'use client';

import { useState } from 'react';
import {
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useConnections } from '@/hooks/useConnections';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

const providerInfo: Record<string, { name: string; region: string; description: string }> = {
  powens: {
    name: 'Powens (Budget Insight)',
    region: 'France / EU',
    description: 'Banques, PEA, CTO, Assurance Vie, Crypto, Immobilier',
  },
  lean: {
    name: 'Lean Technologies',
    region: 'UAE / MENA',
    description: 'Banking, balances, transactions',
  },
  saltedge: {
    name: 'Salt Edge',
    region: 'Global (50+ pays)',
    description: '5000+ institutions bancaires',
  },
  binance: {
    name: 'Binance',
    region: 'Global',
    description: 'Crypto holdings, trades, balances',
  },
  ibkr: {
    name: 'Interactive Brokers',
    region: 'Global (170 marchés)',
    description: 'Positions, transactions, multi-devises',
  },
};

const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'default'; icon: typeof CheckCircle2 }> = {
  active: { label: 'Actif', variant: 'success', icon: CheckCircle2 },
  error: { label: 'Erreur', variant: 'danger', icon: AlertCircle },
  pending: { label: 'En attente', variant: 'warning', icon: Clock },
  disconnected: { label: 'Déconnecté', variant: 'default', icon: AlertCircle },
};

export default function ConnectionsPage() {
  const { data: connections, refetch } = useConnections();
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const connList = connections ?? [];

  async function handleConnect(provider: string) {
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          callbackUrl: `${window.location.origin}/dashboard/connections`,
        }),
      });

      const data = await res.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setShowAddModal(false);
        refetch();
        toast('Connexion initiée', 'success');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast('Erreur lors de la connexion', 'error');
    }
  }

  async function handleSync(connectionId: string) {
    setSyncing(connectionId);
    try {
      await fetch(`/api/connections/${connectionId}/sync`, {
        method: 'POST',
      });
      refetch();
      toast('Synchronisation terminée', 'success');
    } catch (error) {
      console.error('Sync error:', error);
      toast('Erreur de synchronisation', 'error');
    } finally {
      setSyncing(null);
    }
  }

  async function handleDelete(connectionId: string) {
    setDeleting(connectionId);
    try {
      await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });
      refetch();
      toast('Provider déconnecté', 'info');
    } catch (error) {
      console.error('Delete error:', error);
      toast('Erreur lors de la déconnexion', 'error');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Connexions</h1>
          <p className="text-[#a0a0a6] text-sm mt-1">
            {connList.length} provider{connList.length !== 1 ? 's' : ''} connecté{connList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} className="mr-2" />
          Ajouter un provider
        </Button>
      </div>

      {connList.length === 0 ? (
        <Card className="animate-in animate-in-1">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-[rgba(255,255,255,0.04)] rounded-[16px] flex items-center justify-center mb-4">
              <Link2 size={32} className="text-[#6b6b73]" />
            </div>
            <h2 className="text-lg font-medium text-[#f5f5f5] mb-2">
              Aucun provider connecté
            </h2>
            <p className="text-sm text-[#6b6b73] max-w-md mb-6">
              Connectez vos comptes bancaires, courtiers et plateformes crypto pour synchroniser
              automatiquement vos données financières.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-2" />
              Connecter un provider
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connList.map((conn, i) => {
            const info = providerInfo[conn.provider];
            const status = statusConfig[conn.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const isSyncing = syncing === conn.id;
            const isDeleting = deleting === conn.id;

            return (
              <Card
                key={conn.id}
                className={`animate-in animate-in-${Math.min(i + 1, 8)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f4be7e]/10 rounded-[12px] flex items-center justify-center">
                      <Link2 size={20} className="text-[#f4be7e]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#f5f5f5] text-sm">
                        {info?.name || conn.provider}
                      </h3>
                      <p className="text-xs text-[#6b6b73]">
                        {info?.region || 'Global'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>
                    <StatusIcon size={12} className="mr-1" />
                    {status.label}
                  </Badge>
                </div>

                {conn.lastSyncAt && (
                  <p className="text-xs text-[#6b6b73] mb-3">
                    Dernière sync : {formatRelativeTime(conn.lastSyncAt)}
                  </p>
                )}

                {conn.lastSyncError && (
                  <p className="text-xs text-[#f87171] mb-3">
                    {conn.lastSyncError}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                  <button
                    onClick={() => handleSync(conn.id)}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 text-xs text-[#6b6b73] hover:text-[#f4be7e] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Sync...' : 'Synchroniser'}
                  </button>
                  <button
                    onClick={() => handleDelete(conn.id)}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 text-xs text-[#6b6b73] hover:text-[#f87171] transition-colors disabled:opacity-50 ml-auto"
                  >
                    <Trash2 size={12} />
                    {isDeleting ? 'Suppression...' : 'Déconnecter'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Connecter un provider"
      >
        <div className="space-y-3">
          {Object.entries(providerInfo).map(([slug, info]) => {
            const alreadyConnected = connList.some((c) => c.provider === slug);
            return (
              <button
                key={slug}
                className="w-full flex items-center justify-between p-3 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.06)] rounded-[12px] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleConnect(slug)}
                disabled={alreadyConnected}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#f5f5f5]">
                      {info.name}
                    </span>
                    <span className="text-[10px] text-[#6b6b73] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded">
                      {info.region}
                    </span>
                  </div>
                  <div className="text-xs text-[#6b6b73] mt-0.5">
                    {info.description}
                  </div>
                  {alreadyConnected && (
                    <div className="text-xs text-[#34d399] mt-1">Déjà connecté</div>
                  )}
                </div>
                {!alreadyConnected && (
                  <ExternalLink size={16} className="text-[#6b6b73] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#6b6b73] mt-4 text-center">
          Connexion sécurisée en lecture seule via OAuth
        </p>
      </Modal>
    </div>
  );
}
