import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// El navegador conserva el scroll entre navegaciones de la SPA, así que al abrir
// una categoría desde el fondo de la portada la nueva página arrancaba por la
// mitad. Se sube al tope en cada cambio de ruta, con dos excepciones:
//
//   · POP (atrás/adelante): el navegador restaura la posición anterior y pisarla
//     rompe la expectativa de volver a donde estabas.
//   · #hash: el destino es un ancla concreta, no el principio de la página.
//
// Sólo mira `pathname`: cambiar un query param (la búsqueda de la portada) no
// es cambiar de página y no debe mover el scroll.
export default function useScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP' || hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    // `hash` y `navigationType` se leen en el momento del cambio de ruta; no son
    // disparadores propios.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
}
