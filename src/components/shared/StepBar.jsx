import { Fragment } from 'react'
import { Check } from 'lucide-react'

// Indicador de pasos. Vivía dentro de Setup.jsx; se extrajo cuando el alta de
// categoría pasó a ser también por pasos, para que las dos se vean igual.
// `steps` es [{ id, label }] y `currentIdx` el índice del paso activo.
export default function StepBar({ steps, currentIdx, className = 'mb-7' }) {
  return (
    <div className={`flex items-start ${className}`}>
      {steps.map((s, i) => {
        const done   = i < currentIdx
        const active = i === currentIdx
        return (
          <Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                done   ? 'bg-brand text-base' :
                active ? 'border-2 border-brand text-brand bg-brand/10' :
                         'border border-border-strong text-dim bg-transparent'
              }`}>
                {done ? <Check size={11} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[9px] font-mono tracking-widest whitespace-nowrap transition-colors ${
                active ? 'text-brand' : done ? 'text-muted' : 'text-dim'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mt-3 mx-1 transition-colors ${done ? 'bg-brand' : 'bg-border-strong'}`} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
