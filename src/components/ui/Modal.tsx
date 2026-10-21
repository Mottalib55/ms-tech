'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[8px] animate-[backdropFade_200ms_ease-out]"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-[rgba(20,20,22,0.95)] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 w-full max-w-md',
          'shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-[20px]',
          'animate-[modalEnter_350ms_cubic-bezier(0.22,1,0.36,1)]',
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded-[10px] transition-colors duration-200 text-[#6b6b73] hover:text-[#f5f5f5]"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
