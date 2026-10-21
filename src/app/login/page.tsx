'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('alexandre.dupont@email.com');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(244,190,126,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8 animate-in">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-gradient-to-br from-[#d4a06a] via-[#f4be7e] to-[#f9d09f] shadow-[0_0_20px_rgba(244,190,126,0.3)]">
              <span className="text-[#0a0a0b] font-bold">MS</span>
            </div>
            <span className="text-xl font-bold text-[#f5f5f5]">MS Tech</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Connexion</h1>
          <p className="text-[#a0a0a6] mt-2">Accédez à votre espace patrimonial</p>
        </div>

        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 backdrop-blur-[12px] animate-in animate-in-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#f87171]/8 border border-[#f87171]/15 rounded-[12px] p-3">
                <p className="text-sm text-[#f87171]">{error}</p>
              </div>
            )}
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#a0a0a6]">
                <input type="checkbox" className="rounded border-[rgba(255,255,255,0.1)] accent-[#f4be7e]" defaultChecked />
                Se souvenir de moi
              </label>
              <button type="button" className="text-[#f4be7e] hover:text-[#f9d09f] transition-colors">
                Mot de passe oublié ?
              </button>
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Se connecter
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-[#a0a0a6]">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-[#f4be7e] hover:text-[#f9d09f] font-medium transition-colors">
              Créer un compte
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[#6b6b73] mt-6 animate-in animate-in-2">
          En vous connectant, vous acceptez nos CGU et notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
}
