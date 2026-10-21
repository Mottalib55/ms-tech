'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  delay?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  duration = 1200,
  format = (n) => n.toLocaleString('fr-FR'),
  delay = 0,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = ref.current;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Premium easing: cubic-bezier(0.22, 1, 0.36, 1) approximation
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (value - start) * eased;
        setDisplay(current);
        ref.current = current;

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setDisplay(value);
          ref.current = value;
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, delay]);

  return <span className={className}>{format(display)}</span>;
}
