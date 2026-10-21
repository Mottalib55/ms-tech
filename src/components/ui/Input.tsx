'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-[#a0a0a6]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 bg-[#0a0a0b] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-[#f5f5f5] placeholder-[#6b6b73]',
            'focus:outline-none focus:ring-2 focus:ring-[#f4be7e]/30 focus:border-[#f4be7e]/40',
            'transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
            error && 'border-[#f87171] focus:ring-[#f87171]/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-[#f87171]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
