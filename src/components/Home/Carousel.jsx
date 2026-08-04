import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Vitrina horizontal con flechas en escritorio y barra de progreso en mobile.
export default function Carousel({ title, icon = null, count = 0, children }) {
  const ref = useRef(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const [thumb, setThumb] = useState(1);
  const [pos, setPos] = useState(0);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanL(scrollLeft > 4);
    setCanR(scrollLeft < max - 4);
    setThumb(scrollWidth > 0 ? clientWidth / scrollWidth : 1);
    setPos(max > 0 ? scrollLeft / max : 0);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [count, sync]);

  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 290, behavior: 'smooth' });

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-condensed font-bold text-sm tracking-widest text-muted">{title}</h2>
        </div>
        {(canL || canR) && (
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll(-1)}
              disabled={!canL}
              aria-label="Anterior"
              className="flex items-center justify-center w-7 h-7 rounded-full border border-border-mid text-muted hover:border-border-strong hover:text-soft transition-colors cursor-pointer bg-transparent disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canR}
              aria-label="Siguiente"
              className="flex items-center justify-center w-7 h-7 rounded-full border border-border-mid text-muted hover:border-border-strong hover:text-soft transition-colors cursor-pointer bg-transparent disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {(canL || canR) && (
        <div className="sm:hidden mx-auto mt-1 h-1 w-20 rounded-full bg-border-mid relative overflow-hidden">
          <div
            className="absolute top-0 h-full rounded-full bg-muted transition-[left] duration-75"
            style={{ width: `${thumb * 100}%`, left: `${pos * (100 - thumb * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
