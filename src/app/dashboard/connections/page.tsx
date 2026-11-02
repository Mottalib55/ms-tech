'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock, Link2, Lock, Plus, RefreshCw, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { ConfirmDialog, EmptyState, FormError, Loader, PageHeader } from '@/components/ui/kit';
import { toast } from '@/components/ui/Toast';
import { useAction, useConnections } from '@/hooks/data';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { Connection, Provider } from '@/types';

const DESCRIPTIONS: Record<string, string> = {
  powens: 'Banques, PEA, assurance-vie en France et en Europe',
  lean: 'Banques aux Émirats et au Moyen-Orient',
  saltedge: 'Plus de 5 000 banques dans le monde',
  binance: 'Soldes crypto, avec une clé en lecture seule',
  ibkr: 'Positions et soldes multi-devises',
  sandbox: 'Une fausse banque pour essayer le parcours complet',
};

const CONNECT_ERRORS: Record<string, string> = {
  denied: 'Connexion annulée : vous avez refusé l\'accès.',
  expired: 'Ce lien de connexion a expiré. Recommencez.',
  failed: 'Le fournisseur n\'a pas pu finaliser la connexion. Réessayez.',
  sync: 'Compte relié, mais la première synchronisation a échoué. Le détail figure sur la carte.',
};

function ConnectResult({ providers }: { providers: Provider[] }) {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const ok = params.get('connected');
    const err = params.get('connect_error');
    if (ok) toast(`${providers.find((p) => p.slug === ok)?.name ?? 'Compte'} connecté`, 'success');
    if (err) toast(CONNECT_ERRORS[err] ?? 'Connexion impossible.', 'error');
    if (ok || err) router.replace('/dashboard/connections');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  return null;
}

const KEY_FORMS: Record<string, { intro: string; key: string; secret: string; secretHidden: boolean }> = {
  binance: { intro: 'Créez sur Binance une clé API avec la seule autorisation « lecture », sans retrait ni trading.', key: 'Clé API', secret: 'Secret API', secretHidden: true },
  ibkr: { intro: 'Dans le Client Portal, ouvrez Flex Queries : créez une requête Activity avec Open Positions, Account Information et Net Asset Value, puis générez un jeton Flex Web Service.', key: 'Jeton Flex', secret: 'Numéro de la requête Flex', secretHidden: false },
};

function KeysForm({ provider, onDone }: { provider: Provider; onDone: () => void }) {
  const form = KEY_FORMS[provider.slug];
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = useAction((body: object) => api('/api/connections', { method: 'POST', body }), { success: `${provider.name} connecté`, onSuccess: onDone, onError: (e) => setError(e.message) });
  const submit = (e: FormEvent) => { e.preventDefault(); setError(null); save.mutate({ provider: provider.slug, apiKey, apiSecret }); };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <p className="text-sm text-[#a0a0a6]">{form.intro}</p>
      <Input id="provider-key" label={form.key} value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" autoCapitalize="none" />
      <Input id="provider-secret" label={form.secret} type={form.secretHidden ? 'password' : 'text'} value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} autoComplete="off" autoCapitalize="none" />
      <Button type="submit" loading={save.isPending} className="w-full">Connecter {provider.name}</Button>
      <p className="text-xs text-[#8e8e98] flex items-center gap-1.5 justify-center"><Lock size={12} />Identifiants chiffrés, jamais affichés à nouveau.</p>
    </form>
  );
}

function ProviderPicker({ providers, onClose }: { providers: Provider[]; onClose: () => void }) {
  const [keyFor, setKeyFor] = useState<Provider | null>(null);
  const start = useAction((provider: string) => api<{ redirectUrl?: string; widgetUrl?: string }>('/api/connections', { method: 'POST', body: { provider } }), {
    onSuccess: (r) => {
      const url = r.redirectUrl ?? r.widgetUrl;
      if (url) window.location.href = url;
      else { toast('Connexion établie', 'success'); onClose(); }
    },
  });
  if (keyFor) return <KeysForm provider={keyFor} onDone={onClose} />;
  return (
    <div className="space-y-2">
      {providers.map((p) => (
        <button
          key={p.slug}
          disabled={!p.configured || start.isPending}
          onClick={() => (p.kind === 'api_key' ? setKeyFor(p) : start.mutate(p.slug))}
          className="w-full flex items-center justify-between gap-3 p-3 min-h-16 text-left bg-white/[0.04] hover:bg-white/[0.07] rounded-[12px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-[#f5f5f5]">{p.name}</span><span className="text-[10px] text-[#a0a0a6] bg-white/[0.06] px-1.5 py-0.5 rounded">{p.region}</span></span>
            <span className="block text-xs text-[#a0a0a6] mt-0.5">{p.configured ? DESCRIPTIONS[p.slug] : 'Bientôt disponible'}</span>
          </span>
          {p.configured && <Plus size={17} className="text-[#f4be7e] shrink-0" />}
        </button>
      ))}
      <p className="text-xs text-[#8e8e98] pt-2 flex items-center gap-1.5 justify-center"><Lock size={12} />Accès en lecture seule. Vous pouvez le retirer à tout moment.</p>
    </div>
  );
}

const STATUS = {
  active: { label: 'Actif', variant: 'success' as const, icon: CheckCircle2 },
  error: { label: 'Erreur', variant: 'danger' as const, icon: AlertCircle },
  pending: { label: 'En attente', variant: 'warning' as const, icon: Clock },
};

function ConnectionCard({ connection, name }: { connection: Connection; name: string }) {
  const [confirm, setConfirm] = useState(false);
  const status = STATUS[connection.status as keyof typeof STATUS] ?? STATUS.pending;
  const sync = useAction(() => api(`/api/connections/${connection.id}/sync`, { method: 'POST' }), { success: `${name} synchronisé` });
  const remove = useAction(() => api(`/api/connections/${connection.id}`, { method: 'DELETE' }), { success: `${name} déconnecté`, onSuccess: () => setConfirm(false) });
  const n = connection._count.financialAccounts;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 bg-[#f4be7e]/10 rounded-[12px] flex items-center justify-center shrink-0"><Link2 size={19} className="text-[#f4be7e]" /></span>
          <span className="min-w-0"><span className="block font-medium text-[#f5f5f5] text-sm truncate">{name}</span><span className="block text-xs text-[#8e8e98]">{n} compte{n > 1 ? 's' : ''} · dernière sync : {formatRelativeTime(connection.lastSyncAt).toLowerCase()}</span></span>
        </div>
        <Badge variant={status.variant}><status.icon size={12} className="mr-1" />{status.label}</Badge>
      </div>
      {connection.lastSyncError && <p role="alert" className="text-xs text-[#f87171] mb-3">{connection.lastSyncError}</p>}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
        <Button variant="ghost" size="sm" loading={sync.isPending} onClick={() => sync.mutate()}><RefreshCw size={14} className="mr-1.5" />Synchroniser</Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirm(true)} className="hover:text-[#f87171]"><Trash2 size={14} className="mr-1.5" />Déconnecter</Button>
      </div>
      <ConfirmDialog isOpen={confirm} onClose={() => setConfirm(false)} title={`Déconnecter ${name} ?`} text={`L'accès sera retiré. ${n} compte${n > 1 ? 's' : ''} et leurs données quitteront votre patrimoine.`} confirmLabel="Déconnecter" loading={remove.isPending} onConfirm={() => remove.mutate()} />
    </Card>
  );
}

export default function ConnectionsPage() {
  const query = useConnections();
  const [adding, setAdding] = useState(false);
  const add = <Button onClick={() => setAdding(true)}><Plus size={16} className="mr-1.5" />Connecter</Button>;
  return (
    <div className="space-y-5">
      <PageHeader title="Connexions" subtitle="Vos banques et plateformes, synchronisées automatiquement" action={add} />
      <Loader query={query}>
        {({ connections, providers }) => (
          <>
            <Suspense><ConnectResult providers={providers} /></Suspense>
            {connections.length === 0 ? (
              <Card><EmptyState icon={<Link2 size={26} />} title="Aucune connexion" text="Reliez une banque ou une plateforme : soldes, positions et opérations se mettent à jour tout seuls." action={add} /></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connections.map((c) => <ConnectionCard key={c.id} connection={c} name={providers.find((p) => p.slug === c.provider)?.name ?? c.provider} />)}
              </div>
            )}
            <Modal isOpen={adding} onClose={() => setAdding(false)} title="Connecter un compte"><ProviderPicker providers={providers} onClose={() => setAdding(false)} /></Modal>
          </>
        )}
      </Loader>
    </div>
  );
}
