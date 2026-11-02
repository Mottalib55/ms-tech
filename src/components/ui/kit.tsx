'use client';

import { ReactNode, SelectHTMLAttributes, useId, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from './Button';
import Modal from './Modal';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('rounded-[10px] bg-hover animate-pulse', className)} />;
}

export function PageSkeleton() {
  const t = useTranslations('common');
  return (
    <div role="status" aria-label={t('loading')} className="space-y-6">
      <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72 max-w-full" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      <div className="w-12 h-12 bg-surface rounded-[12px] flex items-center justify-center mb-4 text-muted">{icon}</div>
      <h2 className="text-base font-semibold text-ink mb-1">{title}</h2>
      <p className="text-sm text-muted max-w-sm mb-5">{text}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error?: Error | null; onRetry?: () => void }) {
  const t = useTranslations('common');
  return (
    <div role="alert" className="flex flex-col items-center text-center py-12 px-4">
      <AlertCircle size={32} className="text-neg mb-3" />
      <p className="text-ink font-medium mb-1">{t('loadError')}</p>
      <p className="text-sm text-muted mb-4">{error?.message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}><RefreshCw size={14} className="me-2" />{t('retry')}</Button>}
    </div>
  );
}

/** The three states every data page has, in one place. */
export function Loader<T>({ query, children, skeleton }: {
  query: { data?: T; isPending: boolean; isError: boolean; error: Error | null; refetch: () => unknown };
  children: (data: T) => ReactNode;
  skeleton?: ReactNode;
}) {
  if (query.isPending) return <>{skeleton ?? <PageSkeleton />}</>;
  if (query.isError || query.data === undefined) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return <>{children(query.data)}</>;
}

export function Select({ label, id, children, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="space-y-1.5">
      <label htmlFor={fid} className="block text-sm font-medium text-muted">{label}</label>
      <select id={fid} className={cn('w-full h-11 px-3 bg-bg border border-line rounded-[10px] text-ink text-base sm:text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent', className)} {...props}>
        {children}
      </select>
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-0.5 bg-surface rounded-[10px] p-0.5 max-w-full overflow-x-auto">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn('px-3 min-h-9 text-xs font-medium rounded-[8px] whitespace-nowrap transition-colors', o.value === value ? 'bg-raised text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, text, confirmLabel, loading, danger = true }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; text: string; confirmLabel: string; loading?: boolean; danger?: boolean;
}) {
  const t = useTranslations('common');
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-muted mb-5">{text}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/** Amount field: accepts "1 234,50" and keeps the raw text while typing. */
export function useAmount(initial?: number) {
  return useState(initial === undefined ? '' : String(initial).replace('.', ','));
}

export function StatCard({ label, value, icon, hint, tone }: { label: string; value: ReactNode; icon?: ReactNode; hint?: ReactNode; tone?: 'positive' | 'negative' }) {
  return (
    <div className="min-w-0 bg-surface rounded-[14px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs sm:text-sm text-muted leading-tight">{label}</span>
        {icon && <span className="shrink-0">{icon}</span>}
      </div>
      <div className={cn('text-lg sm:text-2xl font-semibold tracking-tight tabular-nums truncate', tone === 'positive' ? 'text-pos' : tone === 'negative' ? 'text-neg' : 'text-ink')}>{value}</div>
      {hint && <div className="text-xs text-muted mt-1 leading-snug">{hint}</div>}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div role="alert" className="bg-neg/10 rounded-[10px] p-3 text-sm text-neg">{message}</div>;
}
