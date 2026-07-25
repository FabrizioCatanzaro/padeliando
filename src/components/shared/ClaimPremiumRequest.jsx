import { useState } from 'react'
import { Loader2, Check, Send, ShieldCheck } from 'lucide-react'
import { api } from '../../utils/api'
import { useAuth } from '../../context/useAuth'

// El usuario pagó y no se activó. Paso 1: ingresa el email de MP con el que pagó
// y le mandamos un código A ESE EMAIL (así solo el verdadero pagador puede
// activar). Paso 2: ingresa el código → activamos y queda auto-renovable.
export default function ClaimPremiumRequest({ compact = false, onActivated }) {
  const { refreshUser } = useAuth()
  const [step, setStep] = useState('email') // email | code | activated | notified
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function sendCode() {
    if (!email.trim()) { setError('Ingresá el email de tu cuenta de Mercado Pago.'); return }
    setBusy(true); setError(null)
    try {
      const res = await api.subscriptions.claimStart(email.trim())
      if (res?.sent) setStep('code')
      else setStep('notified')
    } catch (e) {
      setError(e.message || 'No se pudo enviar. Intentá de nuevo.')
    } finally { setBusy(false) }
  }

  async function verifyCode() {
    if (!code.trim()) { setError('Ingresá el código que te llegó por email.'); return }
    setBusy(true); setError(null)
    try {
      const res = await api.subscriptions.claimVerify(code.trim())
      if (res?.activated) {
        await refreshUser()
        setStep('activated')
        onActivated?.()
      }
    } catch (e) {
      setError(e.message || 'No se pudo verificar. Intentá de nuevo.')
    } finally { setBusy(false) }
  }

  if (step === 'activated') {
    return (
      <div className="bg-green/8 border border-green/25 rounded-xl p-4 flex items-start gap-3">
        <Check size={18} className="text-green flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green/90">
          ¡Listo! Verificamos tu pago y activamos tu Premium. Se renovará automáticamente.
        </p>
      </div>
    )
  }

  if (step === 'notified') {
    return (
      <div className="bg-surface-alt border border-border-strong rounded-xl p-4 flex items-start gap-3">
        <Check size={18} className="text-brand flex-shrink-0 mt-0.5" />
        <p className="text-sm text-secondary">
          No pudimos confirmar el pago automáticamente (puede tardar unos minutos en acreditarse). Le avisamos al equipo con tu dato y lo activamos a la brevedad.
        </p>
      </div>
    )
  }

  const wrap = compact ? '' : 'bg-surface-alt border border-border-strong rounded-xl p-4'

  if (step === 'code') {
    return (
      <div className={`flex flex-col gap-3 text-left ${wrap}`}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand" />
          <p className="text-sm text-soft font-semibold">Verificá tu pago</p>
        </div>
        <p className="text-xs text-secondary leading-relaxed">
          Te enviamos un código a <span className="text-soft">{email}</span>. Ingresalo para activar tu Premium.
        </p>
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código de 6 dígitos"
          disabled={busy}
          className="w-full bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted tracking-widest focus:outline-none focus:border-brand transition disabled:opacity-60"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <button
          type="button"
          onClick={verifyCode}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-brand text-black font-condensed font-bold tracking-wide py-2.5 rounded-xl hover:brightness-110 active:brightness-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
          {busy ? 'Verificando...' : 'Activar Premium'}
        </button>
        <button
          type="button"
          onClick={() => { setStep('email'); setCode(''); setError(null) }}
          className="text-[11px] text-secondary hover:text-white transition self-start"
        >
          ← Usar otro email
        </button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-3 text-left ${wrap}`}>
      {!compact && <p className="text-sm text-soft font-semibold">¿Pagaste y no se activó?</p>}
      <p className="text-xs text-secondary leading-relaxed">
        Ingresá el email de la cuenta de Mercado Pago con la que pagaste. Te mandamos un código a ese email para confirmar que es tuyo.
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        disabled={busy}
        className="w-full bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-brand transition disabled:opacity-60"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        type="button"
        onClick={sendCode}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 bg-brand text-black font-condensed font-bold tracking-wide py-2.5 rounded-xl hover:brightness-110 active:brightness-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {busy ? 'Buscando tu pago...' : 'Enviarme el código'}
      </button>
    </div>
  )
}
