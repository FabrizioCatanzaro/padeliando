import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, LifeBuoy } from 'lucide-react'
import Btn from '../shared/Btn'
import Fronton from './Fronton'

// 404 se lee 40-40 en un tanteador de pádel: el punto de oro.
const marcador = (hits) => {
  if (hits >= 10) return { t: '¡JUEGO!',  s: 'Ganaste el punto de oro. La página sigue sin aparecer, pero qué manera de defender.' }
  if (hits >= 5)  return { t: 'VENTAJA',  s: 'Cinco devoluciones seguidas. Esto ya es mérito tuyo.' }
  return { t: '40 – 40', s: 'Esta página no existe, pero el punto sigue vivo.' }
}

export default function NotFoundView() {
  const [hits, setHits] = useState(0)
  const onScore = useCallback((h) => setHits(h), [])
  const { t, s } = marcador(hits)

  // Una ruta inexistente no debería quedar indexada; el hosting devuelve 200
  // para todo porque la app es una SPA.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  return (
    <div className="bg-base text-content font-sans min-h-[80vh] pb-16">
      <div className="px-6 pt-6 pb-5 border-b border-border">
        <p className="text-[11px] font-mono text-muted uppercase tracking-widest mb-1">Error 404</p>
        <h1 className="font-condensed font-bold text-[30px] text-content leading-tight">
          Punto de oro
        </h1>
      </div>

      <div className="max-w-md mx-auto px-6">
        <div className="mt-8 text-center">
          <p className="font-condensed font-bold text-brand text-[40px] leading-none tracking-widest">
            {t}
          </p>
          {/* La altura está reservada para que el texto más largo no empuje el
              lienzo hacia abajo al cambiar el marcador. */}
          <p className="text-[13px] text-soft mt-3 min-h-[3.25rem]">{s}</p>
        </div>

        <div className="mt-6">
          <Fronton onScore={onScore} />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
          <Link to="/"><Btn variant="primary" icon={Home} full>VOLVER AL INICIO</Btn></Link>
          <Link to="/contacto"><Btn variant="secondary" icon={LifeBuoy} full>CONTACTO</Btn></Link>
        </div>
      </div>
    </div>
  )
}
