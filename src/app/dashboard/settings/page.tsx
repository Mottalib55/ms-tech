'use client';

import { useState, useEffect } from 'react';
import { User, Shield, Globe, Link2, FlaskConical } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useConnections } from '@/hooks/useConnections';
import { toast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const { data: connections } = useConnections();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState('EUR');
  const [language, setLanguage] = useState('fr');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setDemoMode(localStorage.getItem('ms-tech-demo') === 'true');
  }, []);

  function toggleDemoMode() {
    const next = !demoMode;
    setDemoMode(next);
    if (next) {
      localStorage.setItem('ms-tech-demo', 'true');
      toast('Mode démo activé — données fictives', 'info');
    } else {
      localStorage.removeItem('ms-tech-demo');
      toast('Mode démo désactivé — données réelles', 'info');
    }
    queryClient.invalidateQueries();
  }

  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePreferences = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Paramètres</h1>
        <p className="text-[#a0a0a6] text-sm mt-1">Gérez votre profil et vos préférences</p>
      </div>

      {saved && (
        <div className="bg-[#f4be7e]/8 border border-[#f4be7e]/15 rounded-[12px] p-3 animate-in">
          <p className="text-sm text-[#f4be7e]">Modifications enregistrées avec succès.</p>
        </div>
      )}

      <Card className="animate-in animate-in-1">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#f4be7e]" />
            <CardTitle>Profil</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center ring-2 ring-[#f4be7e]/30 bg-[rgba(244,190,126,0.1)]">
              <span className="text-[#f4be7e] text-xl font-bold">{name.charAt(0) || 'U'}</span>
            </div>
            <div>
              <p className="text-[#f5f5f5] font-medium">{name}</p>
              <p className="text-sm text-[#6b6b73]">Membre</p>
            </div>
          </div>
          <Input id="settings-name" label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="settings-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={handleSaveProfile}>Enregistrer</Button>
        </div>
      </Card>

      <Card className="animate-in animate-in-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-[#f4be7e]" />
            <CardTitle>Préférences</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="currency" className="block text-sm font-medium text-[#a0a0a6]">Devise</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#f4be7e]/30 focus:border-[#f4be7e]/40 transition-all duration-[250ms]"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="language" className="block text-sm font-medium text-[#a0a0a6]">Langue</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#f4be7e]/30 focus:border-[#f4be7e]/40 transition-all duration-[250ms]"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <Button onClick={handleSavePreferences}>Enregistrer</Button>
        </div>
      </Card>

      <Card className="animate-in animate-in-3">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-[#f4be7e]" />
            <CardTitle>Providers connectés</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-3">
          {connections && connections.length > 0 ? (
            connections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.03)] rounded-[12px]">
                <div>
                  <p className="text-sm font-medium text-[#f5f5f5] capitalize">{conn.provider}</p>
                  <p className="text-xs text-[#6b6b73]">
                    {conn.lastSyncAt ? `Dernière sync: ${new Date(conn.lastSyncAt).toLocaleString('fr-FR')}` : 'Jamais synchronisé'}
                  </p>
                </div>
                <Badge variant={conn.status === 'active' ? 'success' : conn.status === 'error' ? 'danger' : 'warning'}>
                  {conn.status === 'active' ? 'Actif' : conn.status === 'error' ? 'Erreur' : 'En attente'}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#6b6b73]">Aucun provider connecté. Rendez-vous dans la section Connexions.</p>
          )}
        </div>
      </Card>

      <Card className="animate-in animate-in-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical size={18} className="text-[#f4be7e]" />
            <CardTitle>Mode démo</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-3">
          <p className="text-sm text-[#6b6b73]">
            Activez le mode démo pour explorer l&apos;application avec des données fictives, sans connexion réelle à vos comptes.
          </p>
          <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.03)] rounded-[12px]">
            <span className="text-sm text-[#f5f5f5]">Mode démo</span>
            <button
              onClick={toggleDemoMode}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                demoMode ? 'bg-[#f4be7e]' : 'bg-[rgba(255,255,255,0.1)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  demoMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card className="animate-in animate-in-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#f4be7e]" />
            <CardTitle>Sécurité</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-4">
          <Input
            id="current-password"
            label="Mot de passe actuel"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            id="new-password"
            label="Nouveau mot de passe"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button onClick={() => { setCurrentPassword(''); setNewPassword(''); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
            Changer le mot de passe
          </Button>
        </div>
      </Card>
    </div>
  );
}
