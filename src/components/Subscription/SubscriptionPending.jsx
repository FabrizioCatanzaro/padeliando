import { useNavigate } from 'react-router-dom'
import { Clock, Check, Home } from 'lucide-react'

const STEPS = [
  'Acercate a un punto de pago habilitado (Rapipago, Pago Fácil, etc.)',
  'Mostrá el código o cupón que te envió Mercado Pago',
  'Una vez confirmado el pago, tu cuenta Premium se activa automáticamente',
]

export default function SubscriptionPending() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">

        <div className="w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/40 flex items-center justify-center">
          <Clock size={36} className="text-yellow-400" />
        </div>

        <div>
          <h1 className="font-condensed font-bold text-3xl text-white tracking-wide">
            Pago pendiente
          </h1>
          <p className="text-secondary text-sm mt-2 max-w-xs mx-auto">
            Tu pago está en proceso. Una vez acreditado, tu cuenta Premium se activa de forma automática.
          </p>
        </div>

        <div className="w-full bg-surface-alt border border-border-strong rounded-2xl p-5 text-left">
          <p className="text-[10px] font-mono tracking-widest text-dim uppercase mb-3">
            Si elegiste pago en efectivo
          </p>
          <ol className="flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-400 text-[10px] font-bold">{i + 1}</span>
                </div>
                <span className="text-sm text-secondary leading-snug">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="w-full bg-surface-alt border border-border-strong rounded-2xl p-4 flex items-start gap-3 text-left">
          <Check size={16} className="text-brand flex-shrink-0 mt-0.5" />
          <p className="text-sm text-soft leading-snug">
            Recibirás una notificación por email cuando tu suscripción esté activa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 bg-surface-alt border border-border-strong text-white font-semibold rounded-xl py-3.5 hover:bg-surface transition text-sm"
        >
          <Home size={15} />
          Ir al inicio
        </button>

        <p className="text-[11px] text-dim">
          Los pagos en efectivo pueden demorar hasta 2 días hábiles en acreditarse.
        </p>
      </div>
    </div>
  )
}
