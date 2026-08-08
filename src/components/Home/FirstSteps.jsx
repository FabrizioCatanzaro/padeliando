import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'

// Los pasos llegan ya calculados desde utils/onboarding.js: se derivan de los
// datos que la portada tiene cargados, no de un estado guardado.
export default function FirstSteps({ steps, onDismiss }) {
  const hechos = steps.filter((s) => s.done).length
  // Sólo el primero pendiente muestra la explicación: cuatro párrafos juntos se
  // leen como un manual y no como algo que se pueda ir tachando.
  const actualIdx = steps.findIndex((s) => !s.done)

  return (
    <div className="border border-border-strong rounded-lg p-5 mb-8 bg-surface">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="font-condensed font-bold text-[18px] text-white">Primeros pasos</div>
          <div className="text-[11px] font-mono text-muted mt-0.5">
            {hechos} de {steps.length} · desaparece solo al terminar
          </div>
        </div>
        <button
          onClick={onDismiss}
          title="Ocultar"
          aria-label="Ocultar primeros pasos"
          className="shrink-0 bg-transparent border-0 p-1 text-dim hover:text-muted cursor-pointer transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Barra de avance */}
      <div className="h-1 rounded-full bg-base mb-4 overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-[width] duration-500"
          style={{ width: `${(hechos / steps.length) * 100}%` }}
        />
      </div>

      <ol className="flex flex-col gap-2.5">
        {steps.map((s, i) => (
          <li key={s.label} className="flex gap-3 items-start">
            <span
              className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                s.done ? 'bg-brand border-brand' : 'border-border-strong'
              }`}
            >
              {s.done && <Check size={12} className="text-base" strokeWidth={3} />}
            </span>
            <div className="min-w-0">
              <div
                className={`text-[14px] font-sans leading-snug ${
                  s.done ? 'text-dim line-through' : 'text-white'
                }`}
              >
                {s.label}
              </div>
              {i === actualIdx && (
                <div className="text-[13px] text-secondary font-sans leading-relaxed mt-1">
                  {s.help}{' '}
                  <Link
                    to={`/tutorial#${s.section}`}
                    className="text-brand hover:underline whitespace-nowrap"
                  >
                    Ver cómo
                  </Link>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
