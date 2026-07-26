import { useEffect } from 'react'

export const SITE_NAME = 'Padeleando'

/**
 * Fija el título de la pestaña como "<title> — Padeleando".
 *
 * Sin argumento (o con null/'' mientras los datos todavía viajan) deja sólo
 * "Padeleando", así que las páginas dinámicas pueden llamarlo antes de tener el
 * nombre: al llegar el dato el efecto vuelve a correr y completa el título.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const clean = typeof title === 'string' ? title.trim() : ''
    document.title = clean ? `${clean} | ${SITE_NAME}` : SITE_NAME
  }, [title])
}

/**
 * Versión declarativa para envolver rutas con título fijo desde App.jsx y no
 * tener que tocar cada vista. Las rutas cuyo título depende de datos usan el
 * hook directamente.
 */
export function Titled({ title, children }) {
  useDocumentTitle(title)
  return children
}

export default useDocumentTitle
