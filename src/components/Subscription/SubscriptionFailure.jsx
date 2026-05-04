import { useNavigate } from 'react-router-dom'
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react'

export default function SubscriptionFailure() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">

        <div className="w-20 h-20 rounded-full bg-danger/10 border-2 border-danger/40 flex items-center justify-center">
          <XCircle size={36} className="text-danger" />
        </div>

        <div>
          <h1 className="font-condensed font-bold text-3xl text-white tracking-wide">
            El pago no se completó
          </h1>
          <p className="text-secondary text-sm mt-2 max-w-xs mx-auto">
            Hubo un problema al procesar el pago. No se realizó ningún cargo a tu cuenta.
          </p>
        </div>

        <div className="w-full bg-surface-alt border border-border-strong rounded-2xl p-5 text-left">
          <p className="text-[10px] font-mono tracking-widest text-dim uppercase mb-3">
            Posibles causas
          </p>
          <ul className="flex flex-col gap-2.5 text-sm text-secondary">
            <li>• Fondos insuficientes en el medio de pago</li>
            <li>• Pago rechazado por el banco o tarjeta</li>
            <li>• Sesión expirada durante el proceso</li>
            <li>• Cancelaste antes de confirmar el pago</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            onClick={() => navigate('/subscription/manage')}
            className="w-full flex items-center justify-center gap-2 bg-brand text-black font-condensed font-bold tracking-wide py-3.5 rounded-xl hover:brightness-110 active:brightness-90 transition"
          >
            <RefreshCw size={16} />
            Intentar de nuevo
          </button>
          <button
            type="button"
            onClick={() => navigate('/contacto')}
            className="w-full flex items-center justify-center gap-2 bg-surface-alt border border-border-strong text-white font-semibold rounded-xl py-3 hover:bg-surface transition text-sm"
          >
            <MessageCircle size={15} />
            Contactar soporte
          </button>
        </div>

        <p className="text-[11px] text-dim">
          Si el problema persiste podés escribirnos y te ayudamos.
        </p>
      </div>
    </div>
  )
}
