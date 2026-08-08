import { useState } from 'react'
import { ClipboardList, Trophy } from 'lucide-react'
import { api } from '../../utils/api'
import { useAuth } from '../../context/useAuth'
import { dismissRole } from '../../utils/onboarding'

const OPTIONS = [
  {
    role: 'organizer',
    icon: ClipboardList,
    title: 'Organizo',
    text: 'Armo los torneos y cargo los resultados.',
  },
  {
    role: 'player',
    icon: Trophy,
    title: 'Juego',
    text: 'Otro los organiza y yo quiero ver mis partidos.',
  },
]

// Una sola pregunta, la primera vez. No bloquea nada: decide qué le muestra la
// portada, porque el estado vacío daba por sentado que todos vienen a organizar.
export default function RolePicker({ onPick }) {
  const { user, login } = useAuth()
  const [busy, setBusy] = useState(null)

  async function pick(role) {
    if (busy) return
    setBusy(role)
    // Optimista: la portada cambia al instante y el guardado va por detrás. Si
    // falla, se vuelve a preguntar la próxima vez y no pasa nada más.
    login({ ...user, onboarding_role: role })
    onPick?.(role)
    try { await api.auth.updateMe({ onboarding_role: role }) } catch { /* se reintenta */ }
  }

  function skip() {
    dismissRole()
    onPick?.(null)
  }

  return (
    <div className="border border-brand/30 bg-brand/5 rounded-lg p-5 mb-8">
      <div className="font-condensed font-bold text-[20px] text-white mb-1">
        ¿A qué venís a Padeleando?
      </div>
      <div className="text-[12px] font-mono text-muted mb-5">
        Para mostrarte lo que necesitás primero. Podés hacer las dos cosas igual.
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.role}
              onClick={() => pick(opt.role)}
              disabled={!!busy}
              className="flex-1 flex items-start gap-3 text-left bg-surface border border-border-strong hover:border-brand hover:bg-brand/10 rounded-lg p-4 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-default"
            >
              <Icon size={20} className="text-brand shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="block font-condensed font-bold text-[16px] text-white">
                  {opt.title}
                </span>
                <span className="block text-[13px] text-secondary font-sans leading-snug mt-0.5">
                  {opt.text}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <button
        onClick={skip}
        className="mt-4 bg-transparent border-0 p-0 text-[11px] font-mono text-dim hover:text-muted cursor-pointer transition-colors"
      >
        Prefiero mirar por mi cuenta
      </button>
    </div>
  )
}
