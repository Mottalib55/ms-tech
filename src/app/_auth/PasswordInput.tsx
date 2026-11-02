'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ id, label, value, onChange, autoComplete, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; placeholder?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[#a0a0a6]">{label}</label>
      <div className="relative">
        <input
          id={id} type={shown ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete} placeholder={placeholder} required
          className="w-full h-11 pl-4 pr-12 bg-[#0a0a0b] border border-white/[0.12] rounded-[12px] text-base sm:text-sm text-[#f5f5f5] placeholder-[#8e8e98] focus:outline-none focus:ring-2 focus:ring-[#f4be7e]/30 focus:border-[#f4be7e]/40"
        />
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={shown} className="absolute right-0 top-0 w-11 h-11 flex items-center justify-center text-[#a0a0a6] hover:text-[#f5f5f5]">
          {shown ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}
