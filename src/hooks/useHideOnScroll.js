import { useState, useEffect, useRef } from 'react'

// Oculta un elemento fijo cuando el usuario baja y lo devuelve apenas sube, para
// no gastar alto de pantalla en mobile mientras se lee una tabla larga.
//
// Detalles que importan:
//   · `sticky`, no `fixed`: el header conserva su lugar en el flujo, así que no
//     hay salto de layout al aparecer y desaparecer (CLS).
//   · Se ignoran los movimientos menores a `threshold` para que el rebote del
//     scroll por inercia no lo haga parpadear.
//   · Arriba de todo siempre se muestra: nunca se oculta antes de `revealAt`.
//   · `disabled` lo fuerza visible — con un menú desplegado, esconder el header
//     se llevaría el menú puesto.
export default function useHideOnScroll({ disabled = false, threshold = 8, revealAt = 80 } = {}) {
  const [scrolledDown, setScrolledDown] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    // Mientras está deshabilitado no se escucha nada; el valor se fuerza abajo,
    // sin un setState dentro del efecto que provoque un render en cascada.
    if (disabled) return

    lastY.current = window.scrollY
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      // Un rAF por ráfaga de scroll: leer scrollY en cada evento fuerza reflow.
      requestAnimationFrame(() => {
        const y  = window.scrollY
        const dy = y - lastY.current
        if (Math.abs(dy) > threshold) {
          setScrolledDown(dy > 0 && y > revealAt)
          lastY.current = y
        }
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [disabled, threshold, revealAt])

  return disabled ? false : scrolledDown
}
