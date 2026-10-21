'use client';

import { useState } from 'react';
import { User, Shield, Globe } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState(user?.currency || 'EUR');
  const [language, setLanguage] = useState(user?.language || 'fr');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = () => {
    updateUser({ name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePreferences = () => {
    updateUser({ currency, language });
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
              <p className="text-sm text-[#6b6b73]">Membre depuis {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '-'}</p>
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
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
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
