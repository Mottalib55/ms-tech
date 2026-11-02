'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** A centred dialog on desktop, a bottom sheet on a phone. Escape and the backdrop close it. */
export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,a[href]');
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('input,select,textarea')?.focus();
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Portalled to <body>: a card's stacking context must never paint over the dialog.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div data-testid="modal-backdrop" className="absolute inset-0 bg-black/70 animate-[backdropFade_150ms_ease-out]" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative bg-[#141416] border border-[rgba(255,255,255,0.08)] rounded-t-[24px] sm:rounded-[20px] p-5 sm:p-6 w-full sm:max-w-md',
          'max-h-[90dvh] overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6',
          'shadow-[0_24px_80px_rgba(0,0,0,0.5)] animate-[sheetEnter_260ms_cubic-bezier(0.22,1,0.36,1)]',
          className,
        )}
      >
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-[#f5f5f5]">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="w-11 h-11 -mr-2 flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] rounded-[12px] text-[#a0a0a6] hover:text-[#f5f5f5] transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
