import { useState, useEffect, useRef } from 'react';

// Monta a sus hijos recién cuando el hueco está por entrar en pantalla. Sirve
// para bloques pesados que viven al fondo: el margen de anticipación hace que
// carguen mientras siguen fuera de la vista, así el reemplazo del hueco por el
// contenido real no cuenta como desplazamiento.
// El margen de anticipación va corto a propósito: con 800 px el hueco quedaba
// dentro del margen ya en el primer render (el bloque arranca a ~240 px del
// pliegue) y se montaba solo, sin diferir nada.
export default function WhenVisible({ children, minHeight = 600, rootMargin = '150px' }) {
  const ref = useRef(null);
  // Sin soporte de IntersectionObserver se muestra desde el primer render: vale
  // más perder el diferido que dejar el bloque invisible.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, rootMargin]);

  if (visible) return children;
  return <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
}
