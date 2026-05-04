import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Calendar, CreditCard, AlertTriangle, Loader2, Check, ArrowLeft } from 'lucide-react'
import { api } from '../../utils/api'
import { useAuth } from '../../context/useAuth'
import PremiumModal from '../shared/PremiumModal'

const BILLING_LABEL = {
  monthly: 'Mensual',
  annual:  'Anual',
  trial:   '(Período de prueba)',
}

const STATUS_LABEL = {
  active:    { text: 'Activa',    className: 'text-green bg-green/10 border-green/30' },
  cancelled: { text: 'Cancelada', className: 'text-danger bg-danger/10 border-danger/30' },
  paused:    { text: 'Pausada',   className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function SubscriptionManage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelStep, setCancelStep] = useState('idle') // idle | confirm | cancelling | done
  const [cancelError, setCancelError] = useState(null)
  const [cancelledEndsAt, setCancelledEndsAt] = useState(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  useEffect(() => {
    api.subscriptions.me()
      .then(setSub)
      .catch(() => setError('No se pudo cargar la información de tu suscripción.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel() {
    setCancelledEndsAt(sub?.plan_ends_at)
    setCancelStep('cancelling')
    setCancelError(null)
    try {
      await api.subscriptions.cancel()
      await refreshUser()
      const updated = await api.subscriptions.me()
      setSub(updated)
      setCancelStep('done')
    } catch (e) {
      setCancelError(e.message || 'No se pudo cancelar. Intentá de nuevo.')
      setCancelStep('confirm')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 size={24} className="text-brand animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 gap-4 text-center">
        <p className="text-danger text-sm">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-secondary hover:text-white transition"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  const isPremium = sub?.plan === 'premium' && sub?.status === 'active'
  const isCancelled = sub?.status === 'cancelled'
  const statusInfo = STATUS_LABEL[sub?.status] ?? null

  return (
    <div className="max-w-sm mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-surface-alt transition text-muted hover:text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-condensed font-bold text-2xl text-white tracking-wide">Mi suscripción</h1>
          <p className="text-secondary text-xs">Gestioná tu plan de Padeleando</p>
        </div>
      </div>

      {/* Plan actual */}
      <div className="bg-surface-alt border border-border-strong rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPremium ? (
              <Zap size={18} className="text-brand fill-brand" />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full border border-border-strong" />
            )}
            <span className="font-condensed font-bold text-lg text-white">
              {isPremium ? 'Cuenta Premium' : 'Plan Básico'}
            </span>
          </div>
          {statusInfo && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
          )}
        </div>

        {isPremium && (
          <div className="flex flex-col gap-2.5">
            {sub?.billing_period && (
              <div className="flex items-center gap-2.5 text-sm text-secondary">
                <CreditCard size={14} className="text-muted flex-shrink-0" />
                <span>Facturación {BILLING_LABEL[sub.billing_period] ?? sub.billing_period}</span>
              </div>
            )}
            {sub?.plan_ends_at && (
              <div className="flex items-center gap-2.5 text-sm text-secondary">
                <Calendar size={14} className="text-muted flex-shrink-0" />
                <span>
                  {isCancelled ? 'Acceso hasta el' : 'Próxima renovación'}: {formatDate(sub.plan_ends_at)}
                </span>
              </div>
            )}
          </div>
        )}

        {!isPremium && !isCancelled && (
          <p className="text-sm text-secondary">
            Con el plan básico tenés hasta 2 categorías y 2 torneos al mes.
          </p>
        )}

        {isCancelled && sub?.plan_ends_at && (
          <div className="bg-danger/8 border border-danger/25 rounded-xl p-3">
            <p className="text-sm text-danger/90">
              Tu suscripción fue cancelada. Tenés acceso premium hasta el <strong>{formatDate(sub.plan_ends_at)}</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Features incluidas */}
      {isPremium && (
        <div className="bg-surface-alt border border-border-strong rounded-2xl p-5">
          <p className="text-[10px] font-mono tracking-widest text-dim uppercase mb-3">
            Incluido en tu plan
          </p>
          <ul className="flex flex-col gap-2.5">
            {['Categorías ilimitadas', 'Torneos ilimitados', 'Estadísticas avanzadas', 'Álbum de fotos', 'Ícono premium en el perfil', 'Soporte prioritario'].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-soft">
                <div className="w-5 h-5 rounded-full bg-brand/15 border border-brand/40 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-brand" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Acciones */}
      {isPremium && cancelStep !== 'done' && (
        <div className="flex flex-col gap-3">
          {cancelStep === 'idle' && (
            <button
              type="button"
              onClick={() => setCancelStep('confirm')}
              className="w-full py-3 rounded-xl border border-border-strong text-secondary hover:text-white hover:border-danger/50 hover:bg-danger/5 transition text-sm font-semibold"
            >
              Cancelar suscripción
            </button>
          )}

          {cancelStep === 'confirm' && (
            <div className="bg-surface-alt border border-danger/30 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-semibold mb-1">¿Cancelar tu suscripción?</p>
                  <p className="text-xs text-secondary leading-relaxed">
                    Seguirás teniendo acceso premium hasta el{' '}
                    <span className="text-soft">{formatDate(sub?.plan_ends_at)}</span>.
                    Después de esa fecha tu cuenta volverá al plan básico.
                  </p>
                </div>
              </div>
              {cancelError && (
                <p className="text-xs text-danger">{cancelError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setCancelStep('idle'); setCancelError(null) }}
                  className="flex-1 py-2.5 rounded-xl border border-border-strong text-secondary hover:text-white transition text-sm font-semibold"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-2.5 rounded-xl bg-danger text-white font-semibold text-sm hover:brightness-110 active:brightness-90 transition"
                >
                  Sí, cancelar
                </button>
              </div>
            </div>
          )}

          {cancelStep === 'cancelling' && (
            <div className="flex items-center justify-center gap-2 py-3 text-secondary text-sm">
              <Loader2 size={15} className="animate-spin" />
              Cancelando suscripción...
            </div>
          )}
        </div>
      )}

      {cancelStep === 'done' && (
        <div className="bg-surface-alt border border-border-strong rounded-2xl p-5 text-center">
          <p className="text-sm text-white font-semibold mb-1">Suscripción cancelada</p>
          <p className="text-xs text-secondary">
            {cancelledEndsAt
              ? <>Tu acceso premium continúa hasta el {formatDate(cancelledEndsAt)}.</>
              : 'Tu acceso premium continuará hasta el final del período actual.'}
          </p>
        </div>
      )}

      {!isPremium && (
        <button
          type="button"
          onClick={() => setShowPremiumModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-brand text-black font-condensed font-bold tracking-wide py-3.5 rounded-xl hover:brightness-110 active:brightness-90 transition"
        >
          <Zap size={16} />
          Activar Premium
        </button>
      )}

      {/* Nota MP */}
      <p className="text-[11px] text-dim text-center">
        También podés gestionar tu suscripción directamente en la sección{' '}
        <span className="text-brand/70">"Suscripciones"</span> de tu cuenta de Mercado Pago.
      </p>

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
    </div>
  )
}
