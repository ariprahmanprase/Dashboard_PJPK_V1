import { useEffect, useRef } from 'react';

/**
 * Pasang reveal-on-scroll: elemen dengan atribut [data-reveal] di dalam
 * container mendapat kelas 'reveal-visible' saat masuk viewport.
 * Animasi & reduced-motion ditangani di CSS (index.css).
 *
 * Delay bertingkat opsional lewat atribut data-reveal-delay="<ms>".
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const delay = Number(el.dataset.revealDelay ?? 0);
          if (delay > 0) el.style.animationDelay = `${delay}ms`;
          el.classList.add('reveal-visible');
          io.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return ref;
}
