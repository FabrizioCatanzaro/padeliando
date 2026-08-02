import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, LifeBuoy } from 'lucide-react'
import Btn from '../shared/Btn'
import Fronton from './Fronton'

// La misma pantalla sirve para una ruta inventada y para un id que ya no
// existe: sólo cambia de qué se está hablando.
const SUBJECTS = {
  page:       { eyebrow: 'Error 404',               desc: 'Esta página no existe, pero el punto sigue vivo.' },
  category:   { eyebrow: 'Categoría no encontrada', desc: 'Esta categoría no existe o la borraron. El punto, en cambio, sigue vivo.' },
  tournament: { eyebrow: 'Jornada no encontrada',   desc: 'Esta jornada no existe o la borraron. El link puede estar vencido.' },
  club:       { eyebrow: 'Club no encontrado',      desc: 'Este club no existe o lo dieron de baja.' },
  profile:    { eyebrow: 'Perfil no encontrado',    desc: 'No hay ninguna cuenta con ese nombre de usuario.' },
}

// 404 se lee 40-40 en un tanteador de pádel: el punto de oro.
const marcador = (hits) => {
  if (hits >= 10) return { t: '¡JUEGO!', s: 'Ganaste el punto de oro. Sigue sin aparecer, pero qué manera de defender.' }
  if (hits >= 5)  return { t: 'VENTAJA', s: 'Cinco devoluciones seguidas. Esto ya es mérito tuyo.' }
  return null
}

export default function NotFoundView({ subject = 'page' }) {
  const [hits, setHits] = useState(0)
  const onScore = useCallback((h) => setHits(h), [])
  const { eyebrow, desc } = SUBJECTS[subject] ?? SUBJECTS.page
  const rally = marcador(hits)

  // Nada de esto debería quedar indexado; el hosting devuelve 200 para todo
  // porque la app es una SPA.
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
        <p className="text-[11px] font-mono text-muted uppercase tracking-widest mb-1">{eyebrow}</p>
        <h1 className="font-condensed font-bold text-[30px] text-content leading-tight">
          Punto de oro
        </h1>
      </div>

      <div className="max-w-md mx-auto px-6">
        <div className="mt-8 text-center">
          <p className="font-condensed font-bold text-brand text-[40px] leading-none tracking-widest">
            {rally ? rally.t : '40 – 40'}
          </p>
          {/* La altura está reservada para que el texto más largo no empuje el
              lienzo hacia abajo al cambiar el marcador. */}
          <p className="text-[13px] text-soft mt-3 min-h-[3.25rem]">{rally ? rally.s : desc}</p>
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
