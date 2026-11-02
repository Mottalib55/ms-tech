'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'text-pos',
  error: 'text-neg',
  info: 'text-accent',
};

let addToastFn: ((toast: Omit<ToastData, 'id'>) => void) | null = null;

export function toast(message: string, type: ToastData['type'] = 'info') {
  addToastFn?.({ message, type });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...data, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  return (
    <div aria-live="polite" className="fixed start-4 end-4 sm:start-auto bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-4 sm:end-4 z-[100] flex flex-col gap-2 sm:max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  const Icon = icons[t.type];
  const tc = useTranslations('common');

  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), 4000);
    return () => clearTimeout(timer);
  }, [t.id, onRemove]);

  return (
    <div
      role={t.type === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-[12px] border border-line shadow-sm animate-in bg-raised',
        colors[t.type]
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="text-sm flex-1 text-ink">{t.message}</span>
      <button onClick={() => onRemove(t.id)} aria-label={tc('closeMessage')} className="shrink-0 opacity-60 hover:opacity-100 p-1">
        <X size={14} />
      </button>
    </div>
  );
}
