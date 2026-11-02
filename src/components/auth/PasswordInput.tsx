'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PasswordInput({ id, label, value, onChange, autoComplete, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; placeholder?: string;
}) {
  const t = useTranslations('auth.passwordField');
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-muted">{label}</label>
      <div className="relative">
        <input
          id={id} type={shown ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete} placeholder={placeholder} required
          className="w-full h-11 ps-3.5 pe-12 bg-bg border border-line rounded-[10px] text-base sm:text-sm text-ink placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? t('hide') : t('show')} aria-pressed={shown} className="absolute end-0 top-0 w-11 h-11 flex items-center justify-center text-muted hover:text-ink">
          {shown ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}
