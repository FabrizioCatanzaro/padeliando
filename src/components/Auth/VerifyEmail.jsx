import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../utils/api'
import { useAuth } from '../../context/useAuth'

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
    <div className="bg-base flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="font-[Barlow_Condensed] font-black text-2xl tracking-widest text-white mb-6 cursor-pointer"
          onClick={() => navigate('/')}>
          PADEL<span className="text-brand">EANDO</span>
        </div>

        {status === 'loading' && (
          <p className="text-[#555] text-sm font-mono">Confirmando tu email...</p>
        )}

        {status === 'ok' && (
          <>
            <div className="text-green text-4xl mb-4">✓</div>
            <p className="text-white font-semibold mb-2">Email confirmado</p>
            <p className="text-[#555] text-sm mb-6">
              Tu cuenta ya está activa. Te llevaremos a tu cuenta en {countdown}s.
            </p>
            <button onClick={() => navigate('/')}
              className="bg-brand text-base font-[Barlow_Condensed] font-black tracking-widest px-6 py-2.5 rounded text-sm cursor-pointer">
              IR A MI CUENTA
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-danger text-4xl mb-4">✕</div>
            <p className="text-white font-semibold mb-2">No pudimos confirmar tu email</p>
            <p className="text-[#555] text-sm mb-6">{error ?? 'El enlace es inválido o ya expiró'}</p>
            <button onClick={() => navigate('/login')}
              className="bg-brand text-base font-[Barlow_Condensed] font-black tracking-widest px-6 py-2.5 rounded text-sm cursor-pointer">
              IR AL LOGIN
            </button>
          </>
        )}
      </div>
    </div>
  )
}
