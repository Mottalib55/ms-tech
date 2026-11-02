'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ChevronRight, Download, FileText, Globe, Link2, LogOut, Shield, Trash2, User } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { ConfirmDialog, FormError, Loader, PageHeader, Select } from '@/components/ui/kit';
import { toast } from '@/components/ui/Toast';
import { CURRENCIES } from '@/components/forms/AccountForm';
import { useAction, useConnections, useMe } from '@/hooks/data';
import { api } from '@/lib/api';
import { LOCK_KEY, biometricAvailable, verifyBiometric } from '@/lib/native';
import type { Me } from '@/types';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><div className="flex items-center gap-2"><span className="text-[#f4be7e]">{icon}</span><CardTitle>{title}</CardTitle></div></CardHeader>
      {children}
    </Card>
  );
}

function Profile({ me }: { me: Me }) {
  const { update } = useSession();
  const [name, setName] = useState(me.name ?? '');
  const [email, setEmail] = useState(me.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const emailChanged = email.trim().toLowerCase() !== me.email;

  const save = useAction((body: object) => api<Me>('/api/me', { method: 'PATCH', body }), {
    success: 'Profil enregistré',
    onSuccess: async (u) => { setCurrentPassword(''); await update({ name: u.name, email: u.email }); },
    onError: (e) => setError(e.message),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    save.mutate({ name, ...(emailChanged ? { email, currentPassword } : {}) });
  };

  return (
    <Section icon={<User size={18} />} title="Profil">
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormError message={error} />
        <Input id="settings-name" label="Nom" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <Input id="settings-email" label="Email" type="email" value={me.isDemo ? 'Compte de démonstration' : email} onChange={(e) => setEmail(e.target.value)} disabled={me.isDemo} autoComplete="username" autoCapitalize="none" />
        {emailChanged && !me.isDemo && (
          <Input id="settings-email-password" label="Mot de passe actuel (pour changer d'email)" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
        )}
        <Button type="submit" loading={save.isPending}>Enregistrer</Button>
      </form>
    </Section>
  );
}

function Preferences({ me }: { me: Me }) {
  const [currency, setCurrency] = useState(me.currency);
  const [confirm, setConfirm] = useState(false);
  const save = useAction((c: string) => api('/api/me', { method: 'PATCH', body: { currency: c } }), {
    success: 'Devise modifiée',
    onSuccess: () => setConfirm(false),
    onError: (e) => { setConfirm(false); setCurrency(me.currency); toast(e.message, 'error'); },
  });
  return (
    <Section icon={<Globe size={18} />} title="Préférences">
      <div className="space-y-4">
        <Select label="Devise d'affichage" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <p className="text-xs text-[#a0a0a6]">Vos totaux sont convertis avec des cours indicatifs. Changer de devise redémarre la courbe d&apos;évolution du patrimoine.</p>
        <Button disabled={currency === me.currency} onClick={() => setConfirm(true)}>Enregistrer</Button>
      </div>
      <ConfirmDialog isOpen={confirm} onClose={() => { setConfirm(false); setCurrency(me.currency); }} danger={false} title={`Passer en ${currency} ?`} text="L'historique de votre courbe d'évolution sera effacé : elle repartira d'aujourd'hui dans la nouvelle devise. Vos comptes ne changent pas." confirmLabel="Changer de devise" loading={save.isPending} onConfirm={() => save.mutate(currency)} />
    </Section>
  );
}

function Password() {
  const { update } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = useAction((body: object) => api<{ tokenVersion: number }>('/api/me/password', { method: 'POST', body }), {
    success: 'Mot de passe modifié. Vos autres appareils sont déconnectés.',
    onSuccess: async (r) => { await update({ tokenVersion: r.tokenVersion }); setCurrentPassword(''); setNewPassword(''); },
    onError: (e) => setError(e.message),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
    save.mutate({ currentPassword, newPassword });
  };
  return (
    <Section icon={<Shield size={18} />} title="Sécurité">
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormError message={error} />
        <Input id="current-password" label="Mot de passe actuel" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
        <Input id="new-password" label="Nouveau mot de passe" type="password" placeholder="8 caractères minimum" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
        <Button type="submit" loading={save.isPending}>Changer le mot de passe</Button>
      </form>
    </Section>
  );
}

/** Shown in the iOS app only, on a device with Face ID or Touch ID. */
function BiometricLock() {
  const [available, setAvailable] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    biometricAvailable().then((ok) => { setAvailable(ok); setOn(localStorage.getItem(LOCK_KEY) === '1'); });
  }, []);
  if (!available) return null;
  const toggle = async () => {
    if (!(await verifyBiometric())) return;
    localStorage.setItem(LOCK_KEY, on ? '0' : '1');
    setOn(!on);
  };
  return (
    <Section icon={<Shield size={18} />} title="Verrouillage">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#a0a0a6]">Demander Face ID à l&apos;ouverture de l&apos;app.</p>
        <Button variant="secondary" onClick={toggle}>{on ? 'Désactiver' : 'Activer'}</Button>
      </div>
    </Section>
  );
}

function RowLink({ href, icon, label, hint }: { href: string; icon: React.ReactNode; label: string; hint?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 min-h-12 py-2 -mx-2 px-2 rounded-[10px] hover:bg-white/[0.04]">
      <span className="text-[#a0a0a6]">{icon}</span>
      <span className="flex-1 min-w-0"><span className="block text-sm text-[#f5f5f5]">{label}</span>{hint && <span className="block text-xs text-[#8e8e98]">{hint}</span>}</span>
      <ChevronRight size={16} className="text-[#8e8e98]" />
    </Link>
  );
}

function DangerZone() {
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
    <Section icon={<Trash2 size={18} />} title="Zone sensible">
      <p className="text-sm text-[#a0a0a6] mb-4">Supprime définitivement votre compte, vos données et vos connexions.</p>
      <Button variant="danger" onClick={() => setOpen(true)}>Supprimer mon compte</Button>
      <Modal isOpen={open} onClose={close} title="Supprimer votre compte ?">
        <form onSubmit={(e) => { e.preventDefault(); setError(null); remove.mutate(password); }} noValidate className="space-y-4">
          <p className="text-sm text-[#a0a0a6]">Cette action est immédiate et irréversible. Saisissez votre mot de passe pour confirmer.</p>
          <FormError message={error} />
          <Input id="delete-password" label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={close}>Annuler</Button>
            <Button type="submit" variant="danger" loading={remove.isPending} disabled={!password}>Supprimer définitivement</Button>
          </div>
        </form>
      </Modal>
    </Section>
  );
}

function Content({ me }: { me: Me }) {
  const connections = useConnections();
  const count = connections.data?.connections.length ?? 0;
  return (
    <div className="space-y-4 max-w-2xl">
      <Profile me={me} />
      <Preferences key={me.currency} me={me} />
      {!me.isDemo && <Password />}
      <BiometricLock />
      <Section icon={<Download size={18} />} title="Mes données">
        <p className="text-sm text-[#a0a0a6] mb-4">Téléchargez l&apos;ensemble de vos comptes, positions, opérations et budgets au format JSON.</p>
        <a href="/api/me/export" download className="inline-flex items-center justify-center h-11 px-5 text-sm font-medium rounded-[10px] border border-white/[0.06] bg-white/[0.06] hover:bg-white/[0.1] text-[#f5f5f5] transition-colors"><Download size={15} className="mr-2" />Exporter mes données</a>
      </Section>
      <Card>
        <RowLink href="/dashboard/connections" icon={<Link2 size={18} />} label="Connexions" hint={connections.data ? `${count} active${count > 1 ? 's' : ''}` : undefined} />
        <RowLink href="/legal/terms" icon={<FileText size={18} />} label="Conditions générales" />
        <RowLink href="/legal/privacy" icon={<FileText size={18} />} label="Confidentialité" />
        <RowLink href="/legal/mentions" icon={<FileText size={18} />} label="Mentions légales" />
      </Card>
      {!me.isDemo && <DangerZone />}
      <Button variant="secondary" className="w-full" onClick={() => signOut({ callbackUrl: me.isDemo ? '/' : '/login' })}>
        <LogOut size={16} className="mr-2" />{me.isDemo ? 'Quitter la démo' : 'Se déconnecter'}
      </Button>
      <p className="text-xs text-[#8e8e98] text-center">MS Tech, version {APP_VERSION}</p>
    </div>
  );
}

export default function SettingsPage() {
  const me = useMe();
  return (
    <div className="space-y-5">
      <PageHeader title="Paramètres" subtitle="Votre profil, votre sécurité et vos données" />
      <Loader query={me}>{(m) => <Content key={m.id} me={m} />}</Loader>
    </div>
  );
}
