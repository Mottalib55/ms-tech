import { cn } from '@/lib/utils';

export default function Logo({ size = 'md', withName = true, className }: { size?: 'sm' | 'md' | 'lg'; withName?: boolean; className?: string }) {
  const box = { sm: 'w-8 h-8 text-sm', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className={cn(box, 'shrink-0 rounded-[11px] flex items-center justify-center font-bold text-[#0a0a0b] bg-gradient-to-br from-[#d4a06a] via-[#f4be7e] to-[#f9d09f]')}>MS</span>
      {withName && <span className="text-lg font-bold tracking-tight text-[#f5f5f5] whitespace-nowrap">MS Tech</span>}
    </span>
  );
}
