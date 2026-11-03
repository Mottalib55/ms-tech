import { cn } from '@/lib/utils';

/** The K: a slim stem and two arms tapering to a point, like the facets of a cut gem. */
export function KenzMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className} fill="currentColor">
      <polygon points="29,22 37,22 37,78 29,78" />
      <polygon points="62,22 73,22 50.5,49.3 43,49.3" />
      <polygon points="43,50.7 50.5,50.7 74,78 63,78" />
    </svg>
  );
}

export default function Logo({ size = 'md', withName = true, className }: { size?: 'sm' | 'md' | 'lg'; withName?: boolean; className?: string }) {
  const box = { sm: 'w-7 h-7', md: 'w-8 h-8', lg: 'w-11 h-11' }[size];
  return (
    <span dir="ltr" className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn(box, 'shrink-0 rounded-[8px] flex items-center justify-center text-on-primary bg-primary')}><KenzMark className="w-[72%] h-[72%]" /></span>
      {withName && <span className="text-[15px] font-semibold tracking-tight text-ink whitespace-nowrap">Kenz</span>}
    </span>
  );
}
