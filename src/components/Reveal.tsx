import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Soft fade-up when a section scrolls into view. Content is visible by default, and only
 * sections that start below the fold are held back, so nothing is hidden without JavaScript
 * and reduced motion shows everything at once.
 */
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'waiting' | 'shown'>('idle');

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setState('waiting');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState('shown');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${state === 'waiting' ? 'translate-y-2 opacity-0' : ''} ${state === 'shown' ? 'transition-[opacity,transform] duration-200 ease-out' : ''}`}
      style={state === 'shown' ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
