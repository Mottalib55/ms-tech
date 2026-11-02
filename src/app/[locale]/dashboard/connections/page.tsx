'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

function ConnectResult({ providers }: { providers: Provider[] }) {
  const t = useTranslations('connections');
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const ok = params.get('connected');
    const err = params.get('connect_error');
    if (ok) toast(t('connected', { name: providers.find((p) => p.slug === ok)?.name ?? t('accountFallback') }), 'success');
    if (err) toast(t.has(`connectError.${err}`) ? t(`connectError.${err}`) : t('connectError.generic'), 'error');
    if (ok || err) router.replace('/dashboard/connections');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  return null;
}

const HIDDEN_SECRET: Record<string, boolean> = { binance: true, ibkr: false };

function KeysForm({ provider, onDone }: { provider: Provider; onDone: () => void }) {
  const t = useTranslations('connections');
  const k = `keys.${provider.slug}`;
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = useAction((body: object) => api('/api/connections', { method: 'POST', body }), { success: t('connected', { name: provider.name }), onSuccess: onDone, onError: (e) => setError(e.message) });
  const submit = (e: FormEvent) => { e.preventDefault(); setError(null); save.mutate({ provider: provider.slug, apiKey, apiSecret }); };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <p className="text-sm text-muted">{t(`${k}.intro`)}</p>
      <Input id="provider-key" label={t(`${k}.key`)} dir="ltr" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" autoCapitalize="none" />
      <Input id="provider-secret" label={t(`${k}.secret`)} dir="ltr" type={HIDDEN_SECRET[provider.slug] ? 'password' : 'text'} value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} autoComplete="off" autoCapitalize="none" />
      <Button type="submit" loading={save.isPending} className="w-full">{t('keys.submit', { name: provider.name })}</Button>
      <p className="text-xs text-subtle flex items-center gap-1.5 justify-center"><Lock size={12} />{t('keys.encrypted')}</p>
    </form>
  );
}

function ProviderPicker({ providers, onClose }: { providers: Provider[]; onClose: () => void }) {
  const t = useTranslations('connections');
  const [keyFor, setKeyFor] = useState<Provider | null>(null);
  const start = useAction((provider: string) => api<{ redirectUrl?: string; widgetUrl?: string }>('/api/connections', { method: 'POST', body: { provider } }), {
    onSuccess: (r) => {
      const url = r.redirectUrl ?? r.widgetUrl;
      if (url) window.location.href = url;
      else { toast(t('established'), 'success'); onClose(); }
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
          className="w-full flex items-center justify-between gap-3 p-3 min-h-16 text-start bg-surface hover:bg-hover rounded-[12px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-ink">{p.name}</span><span className="text-[10px] text-muted bg-hover px-1.5 py-0.5 rounded">{p.region}</span></span>
            <span className="block text-xs text-muted mt-0.5">{p.configured ? t(`description.${p.slug}`) : t('soon')}</span>
          </span>
          {p.configured && <Plus size={17} className="text-muted shrink-0" />}
        </button>
      ))}
      <p className="text-xs text-subtle pt-2 flex items-center gap-1.5 justify-center"><Lock size={12} />{t('readOnly')}</p>
    </div>
  );
}

const STATUS = {
  active: { variant: 'success' as const, icon: CheckCircle2 },
  error: { variant: 'danger' as const, icon: AlertCircle },
  pending: { variant: 'warning' as const, icon: Clock },
};

function ConnectionCard({ connection, name }: { connection: Connection; name: string }) {
  const t = useTranslations('connections');
  const [confirm, setConfirm] = useState(false);
  const status = STATUS[connection.status as keyof typeof STATUS] ?? STATUS.pending;
  const sync = useAction(() => api(`/api/connections/${connection.id}/sync`, { method: 'POST' }), { success: t('card.synced', { name }) });
  const remove = useAction(() => api(`/api/connections/${connection.id}`, { method: 'DELETE' }), { success: t('card.disconnected', { name }), onSuccess: () => setConfirm(false) });
  const n = connection._count.financialAccounts;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 bg-hover rounded-[10px] flex items-center justify-center shrink-0"><Link2 size={19} className="text-muted" /></span>
          <span className="min-w-0"><span className="block font-medium text-ink text-sm truncate">{name}</span><span className="block text-xs text-subtle">{t('card.accountCount', { count: n })} · {t('card.lastSync', { when: formatRelativeTime(connection.lastSyncAt).toLowerCase() })}</span></span>
        </div>
        <Badge variant={status.variant}><status.icon size={12} className="me-1" />{t(`status.${connection.status in STATUS ? connection.status : 'pending'}`)}</Badge>
      </div>
      {connection.lastSyncError && <p role="alert" className="text-xs text-neg mb-3">{connection.lastSyncError}</p>}
      <div className="flex items-center justify-between pt-2 border-t border-line">
        <Button variant="ghost" size="sm" loading={sync.isPending} onClick={() => sync.mutate()}><RefreshCw size={14} className="me-1.5" />{t('card.sync')}</Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirm(true)} className="hover:text-neg"><Trash2 size={14} className="me-1.5" />{t('card.disconnect')}</Button>
      </div>
      <ConfirmDialog isOpen={confirm} onClose={() => setConfirm(false)} title={t('card.confirmTitle', { name })} text={t('card.confirmText', { accounts: t('card.accountCount', { count: n }) })} confirmLabel={t('card.disconnect')} loading={remove.isPending} onConfirm={() => remove.mutate()} />
    </Card>
  );
}

export default function ConnectionsPage() {
  const t = useTranslations('connections');
  const tn = useTranslations('nav');
  const query = useConnections();
  const [adding, setAdding] = useState(false);
  const add = <Button onClick={() => setAdding(true)}><Plus size={16} className="me-1.5" />{t('connect')}</Button>;
  return (
    <div className="space-y-5">
      <PageHeader title={tn('connections')} subtitle={t('subtitle')} action={add} />
      <Loader query={query}>
        {({ connections, providers }) => (
          <>
            <Suspense><ConnectResult providers={providers} /></Suspense>
            {connections.length === 0 ? (
              <Card><EmptyState icon={<Link2 size={26} />} title={t('emptyTitle')} text={t('emptyText')} action={add} /></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connections.map((c) => <ConnectionCard key={c.id} connection={c} name={providers.find((p) => p.slug === c.provider)?.name ?? c.provider} />)}
              </div>
            )}
            <Modal isOpen={adding} onClose={() => setAdding(false)} title={t('addTitle')}><ProviderPicker providers={providers} onClose={() => setAdding(false)} /></Modal>
          </>
        )}
      </Loader>
    </div>
  );
}
