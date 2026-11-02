'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { ChevronRight, Download, FileText, Globe, Link2, LogOut, Palette, Shield, Trash2, User } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { ConfirmDialog, FormError, Loader, PageHeader, Select } from '@/components/ui/kit';
import { toast } from '@/components/ui/Toast';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import { CURRENCIES } from '@/components/forms/AccountForm';
import { useAction, useConnections, useMe } from '@/hooks/data';
import { api } from '@/lib/api';
import { LOCK_KEY, biometricAvailable, verifyBiometric } from '@/lib/native';
import type { Me } from '@/types';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><div className="flex items-center gap-2"><span className="text-subtle">{icon}</span><CardTitle>{title}</CardTitle></div></CardHeader>
      {children}
    </Card>
  );
}

function Profile({ me }: { me: Me }) {
  const t = useTranslations('settings');
  const { update } = useSession();
  const [name, setName] = useState(me.name ?? '');
  const [email, setEmail] = useState(me.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const emailChanged = email.trim().toLowerCase() !== me.email;

  const save = useAction((body: object) => api<Me>('/api/me', { method: 'PATCH', body }), {
    success: t('profile.saved'),
    onSuccess: async (u) => { setCurrentPassword(''); await update({ name: u.name, email: u.email }); },
    onError: (e) => setError(e.message),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    save.mutate({ name, ...(emailChanged ? { email, currentPassword } : {}) });
  };

  return (
    <Section icon={<User size={18} />} title={t('profile.title')}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormError message={error} />
        <Input id="settings-name" label={t('profile.name')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <Input id="settings-email" label={t('profile.email')} type="email" dir="ltr" value={me.isDemo ? t('profile.demoAccount') : email} onChange={(e) => setEmail(e.target.value)} disabled={me.isDemo} autoComplete="username" autoCapitalize="none" />
        {emailChanged && !me.isDemo && (
          <Input id="settings-email-password" label={t('profile.emailPassword')} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
        )}
        <Button type="submit" loading={save.isPending}>{t('save')}</Button>
      </form>
    </Section>
  );
}

function Appearance() {
  const t = useTranslations('settings.appearance');
  return (
    <Section icon={<Palette size={18} />} title={t('title')}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted">{t('language')}</span><LocaleSwitcher /></div>
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted">{t('theme')}</span><ThemeSwitcher /></div>
      </div>
    </Section>
  );
}

function Preferences({ me }: { me: Me }) {
  const t = useTranslations('settings');
  const [currency, setCurrency] = useState(me.currency);
  const [confirm, setConfirm] = useState(false);
  const save = useAction((c: string) => api('/api/me', { method: 'PATCH', body: { currency: c } }), {
    success: t('preferences.saved'),
    onSuccess: () => setConfirm(false),
    onError: (e) => { setConfirm(false); setCurrency(me.currency); toast(e.message, 'error'); },
  });
  return (
    <Section icon={<Globe size={18} />} title={t('preferences.title')}>
      <div className="space-y-4">
        <Select label={t('preferences.currency')} value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <p className="text-xs text-muted">{t('preferences.note')}</p>
        <Button disabled={currency === me.currency} onClick={() => setConfirm(true)}>{t('save')}</Button>
      </div>
      <ConfirmDialog isOpen={confirm} onClose={() => { setConfirm(false); setCurrency(me.currency); }} danger={false} title={t('preferences.confirmTitle', { currency })} text={t('preferences.confirmText')} confirmLabel={t('preferences.confirm')} loading={save.isPending} onConfirm={() => save.mutate(currency)} />
    </Section>
  );
}

function Password() {
  const t = useTranslations('settings.security');
  const { update } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = useAction((body: object) => api<{ tokenVersion: number }>('/api/me/password', { method: 'POST', body }), {
    success: t('saved'),
    onSuccess: async (r) => { await update({ tokenVersion: r.tokenVersion }); setCurrentPassword(''); setNewPassword(''); },
    onError: (e) => setError(e.message),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError(t('tooShort'));
    save.mutate({ currentPassword, newPassword });
  };
  return (
    <Section icon={<Shield size={18} />} title={t('title')}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormError message={error} />
        <Input id="current-password" label={t('current')} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
        <Input id="new-password" label={t('new')} type="password" placeholder={t('newPlaceholder')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
        <Button type="submit" loading={save.isPending}>{t('submit')}</Button>
      </form>
    </Section>
  );
}

/** Shown in the iOS app only, on a device with Face ID or Touch ID. */
function BiometricLock() {
  const t = useTranslations('settings.lock');
  const tl = useTranslations('common.lock');
  const [available, setAvailable] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    biometricAvailable().then((ok) => { setAvailable(ok); setOn(localStorage.getItem(LOCK_KEY) === '1'); });
  }, []);
  if (!available) return null;
  const toggle = async () => {
    if (!(await verifyBiometric(tl('reason')))) return;
    localStorage.setItem(LOCK_KEY, on ? '0' : '1');
    setOn(!on);
  };
  return (
    <Section icon={<Shield size={18} />} title={t('title')}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{t('text')}</p>
        <Button variant="secondary" onClick={toggle}>{on ? t('off') : t('on')}</Button>
      </div>
    </Section>
  );
}

function RowLink({ href, icon, label, hint }: { href: string; icon: React.ReactNode; label: string; hint?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 min-h-12 py-2 -mx-2 px-2 rounded-[10px] hover:bg-hover">
      <span className="text-muted">{icon}</span>
      <span className="flex-1 min-w-0"><span className="block text-sm text-ink">{label}</span>{hint && <span className="block text-xs text-subtle">{hint}</span>}</span>
      <ChevronRight size={16} className="text-subtle rtl:-scale-x-100" />
    </Link>
  );
}

function DangerZone() {
  const t = useTranslations('settings.danger');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const remove = useAction((p: string) => api('/api/me', { method: 'DELETE', body: { password: p } }), {
    refetch: false,
    onSuccess: () => signOut({ callbackUrl: '/' }),
    onError: (e) => setError(e.message),
  });
  const close = () => { setOpen(false); setPassword(''); setError(null); };
  return (
    <Section icon={<Trash2 size={18} />} title={t('title')}>
      <p className="text-sm text-muted mb-4">{t('text')}</p>
      <Button variant="danger" onClick={() => setOpen(true)}>{t('delete')}</Button>
      <Modal isOpen={open} onClose={close} title={t('modalTitle')}>
        <form onSubmit={(e) => { e.preventDefault(); setError(null); remove.mutate(password); }} noValidate className="space-y-4">
          <p className="text-sm text-muted">{t('modalText')}</p>
          <FormError message={error} />
          <Input id="delete-password" label={t('password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={close}>{tc('cancel')}</Button>
            <Button type="submit" variant="danger" loading={remove.isPending} disabled={!password}>{t('confirm')}</Button>
          </div>
        </form>
      </Modal>
    </Section>
  );
}

function Content({ me }: { me: Me }) {
  const t = useTranslations('settings');
  const connections = useConnections();
  const count = connections.data?.connections.length ?? 0;
  return (
    <div className="space-y-4 max-w-2xl">
      <Profile me={me} />
      <Appearance />
      <Preferences key={me.currency} me={me} />
      {!me.isDemo && <Password />}
      <BiometricLock />
      <Section icon={<Download size={18} />} title={t('data.title')}>
        <p className="text-sm text-muted mb-4">{t('data.text')}</p>
        <a href="/api/me/export" download className="inline-flex items-center justify-center h-11 px-4 text-sm font-medium rounded-[10px] border border-line bg-surface hover:bg-hover text-ink transition-colors"><Download size={15} className="me-2" />{t('data.export')}</a>
      </Section>
      <Card>
        <RowLink href="/dashboard/connections" icon={<Link2 size={18} />} label={t('links.connections')} hint={connections.data ? t('links.activeCount', { count }) : undefined} />
        <RowLink href="/legal/terms" icon={<FileText size={18} />} label={t('links.terms')} />
        <RowLink href="/legal/privacy" icon={<FileText size={18} />} label={t('links.privacy')} />
        <RowLink href="/legal/mentions" icon={<FileText size={18} />} label={t('links.mentions')} />
      </Card>
      {!me.isDemo && <DangerZone />}
      <Button variant="secondary" className="w-full" onClick={() => signOut({ callbackUrl: me.isDemo ? '/' : '/login' })}>
        <LogOut size={16} className="me-2" />{me.isDemo ? t('leaveDemo') : t('signOut')}
      </Button>
      <p className="text-xs text-subtle text-center">{t('version', { version: APP_VERSION ?? '' })}</p>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tn = useTranslations('nav');
  const me = useMe();
  return (
    <div className="space-y-5">
      <PageHeader title={tn('settings')} subtitle={t('subtitle')} />
      <Loader query={me}>{(m) => <Content key={m.id} me={m} />}</Loader>
    </div>
  );
}
