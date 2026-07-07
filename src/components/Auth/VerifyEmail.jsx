import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, Check, X } from 'lucide-react'
import { api } from '../../utils/api'
import { useAuth } from '../../context/useAuth'
import logoUrl from '../../assets/padeleando.svg'

const CARD = 'bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-2xl text-center'

const logoMask = {
  WebkitMaskImage: `url(${logoUrl})`,
  maskImage: `url(${logoUrl})`,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
}

export default function VerifyEmail() {
  const { token }  = useParams()
  const navigate   = useNavigate()
  const { login }  = useAuth()
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [error,  setError]  = useState(null)
  const [countdown, setCountdown] = useState(10)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    ;(async () => {
      try {
        const { user } = await api.auth.verifyEmail(token)
        login(user)
        setStatus('ok')
      } catch (e) {
        setError(e.message)
        setStatus('error')
      }
    })()
  }, [token, login])

  // Cuenta regresiva tras confirmar — redirige al terminar (el usuario puede saltearla con el botón)
  useEffect(() => {
    if (status !== 'ok') return
    if (countdown <= 0) { navigate('/'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [status, countdown, navigate])

  return (
    <div className="bg-base flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-md">
        <div className={CARD}>
          <div
            role="img"
            aria-label="Padeleando"
            onClick={() => navigate('/')}
            className="w-14 h-14 mx-auto mb-6 bg-brand cursor-pointer"
            style={logoMask}
          />

          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-surface-alt border border-border-strong flex items-center justify-center text-secondary">
                <Loader2 size={26} className="animate-spin" />
              </div>
              <p className="text-content font-semibold mb-1">Confirmando tu email</p>
              <p className="text-secondary text-sm">Esto toma solo un momento...</p>
            </>
          )}

          {status === 'ok' && (
            <>
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green/10 border border-green/30 flex items-center justify-center text-green">
                <Check size={30} strokeWidth={2.5} />
              </div>
              <p className="text-content font-semibold mb-2">Email confirmado</p>
              <p className="text-secondary text-sm mb-6">
                Tu cuenta ya está activa. Te llevaremos a tu cuenta en{' '}
                <span className="text-content tabular-nums">{countdown}s</span>.
              </p>
              <button onClick={() => navigate('/')}
                className="w-full bg-brand text-base font-condensed font-black tracking-widest py-3 rounded-lg text-sm hover:brightness-95 transition-[filter] cursor-pointer">
                IR A MI CUENTA
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center text-danger">
                <X size={30} strokeWidth={2.5} />
              </div>
              <p className="text-content font-semibold mb-2">No pudimos confirmar tu email</p>
              <p className="text-secondary text-sm mb-6">{error ?? 'El enlace es inválido o ya expiró'}</p>
              <button onClick={() => navigate('/login')}
                className="w-full bg-brand text-base font-condensed font-black tracking-widest py-3 rounded-lg text-sm hover:brightness-95 transition-[filter] cursor-pointer">
                IR AL LOGIN
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
