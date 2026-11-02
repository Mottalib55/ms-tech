import { cn } from '@/lib/utils';

export default function Logo({ size = 'md', withName = true, className }: { size?: 'sm' | 'md' | 'lg'; withName?: boolean; className?: string }) {
  const box = { sm: 'w-7 h-7 text-[11px]', md: 'w-8 h-8 text-xs', lg: 'w-11 h-11 text-sm' }[size];
  return (
    <span dir="ltr" className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn(box, 'shrink-0 rounded-[8px] flex items-center justify-center font-semibold tracking-tight text-on-primary bg-primary')}>MS</span>
      {withName && <span className="text-[15px] font-semibold tracking-tight text-ink whitespace-nowrap">MS Tech</span>}
    </span>
  );
}
