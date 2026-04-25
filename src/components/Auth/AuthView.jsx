/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '../../utils/api'
import { useAuth } from '../../context/useAuth'

function validatePassword(p) {
  if (p.length < 8)       return 'Mínimo 8 caracteres'
  if (!/[A-Z]/.test(p))   return 'Al menos una mayúscula'
  if (!/[a-z]/.test(p))   return 'Al menos una minúscula'
  if (!/[0-9]/.test(p))   return 'Al menos un número'
  return null
}

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    { ok: password.length >= 8,    label: '8+ chars' },
    { ok: /[A-Z]/.test(password),  label: 'Mayúscula' },
    { ok: /[a-z]/.test(password),  label: 'Minúscula' },
    { ok: /[0-9]/.test(password),  label: 'Número' },
  ]
  return (
    <div className="flex gap-1.5 flex-wrap mt-2">
      {checks.map(({ ok, label }) => (
        <span key={label} className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors
          ${ok
            ? 'text-green bg-[#1a2e1a] border-[#4af07a44]'
            : 'text-[#555] bg-[#111] border-border-strong'
          }`}>
          {ok ? '✓' : '○'} {label}
        </span>
      ))}
    </div>
  )
}

function PasswordInput({ value, onChange, placeholder = '········', onKeyDown }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none pr-10 font-[Barlow]"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export default function AuthView({ mode: initialMode }) {
  const [mode,      setMode]      = useState(initialMode)
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [error,     setError]     = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [verificationSent, setVerificationSent] = useState(null) // email pendiente tras registro
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendStatus, setResendStatus] = useState(null) // 'sending' | 'sent'

  const { login } = useAuth()
  const navigate  = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('expired') === '1'
  const isRegister = mode === 'register'
  const googleDivRef = useRef(null)

  useEffect(() => {
    function initGoogle() {
      if (!googleDivRef.current) return
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            const { user } = await api.auth.google(credential)
            login(user)
            navigate('/')
          } catch (e) {
            setError(e.message)
          }
        },
      })
      window.google.accounts.id.renderButton(googleDivRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: googleDivRef.current.offsetWidth,
        text: 'continue_with',
        locale: 'es_AR',
      })
    }

    if (window.google) initGoogle()
    else window.onGoogleLibraryLoad = initGoogle
  }, [])

  function getFormError() {
    if (!isRegister) return null
    const pwErr = validatePassword(password)
    if (pwErr) return pwErr
    if (password !== password2) return 'Las contraseñas no coinciden'
    return null
  }

  async function handleSubmit() {
    setError(null)
    setNeedsVerification(false)
    const formErr = getFormError()
    if (formErr) { setError(formErr); return }
    setLoading(true)
    try {
      if (isRegister) {
        const res = await api.auth.register({ name, email, password })
        if (res.pending_verification) {
          setVerificationSent(res.email ?? email)
        } else if (res.user) {
          login(res.user)
          navigate('/')
        }
      } else {
        const { user } = await api.auth.login({ email, password })
        login(user)
        navigate('/')
      }
    } catch (e) {
      if (e.data?.needs_verification) setNeedsVerification(true)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification(target) {
    if (!target) return
    setResendStatus('sending')
    try {
      await api.auth.resendVerification(target)
      setResendStatus('sent')
    } catch {
      setResendStatus(null)
    }
  }

  async function handleForgot() {
    if (!forgotEmail.trim()) return
    setLoading(true)
    try {
      await api.auth.forgotPassword(forgotEmail)
      setForgotSent(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m) {
    setMode(m); setError(null); setPassword(''); setPassword2(''); setShowForgot(false)
    setVerificationSent(null); setNeedsVerification(false); setResendStatus(null)
  }

  const label = 'block text-[11px] tracking-widest text-[#555] font-mono mb-1.5 mt-4'

  // Vista de "confirmá tu email" (tras registrarse)
  if (verificationSent) {
    return (
      <div className="bg-base flex items-start justify-center pt-10 px-4">
        <div className="w-full max-w-sm mt-8 text-center">
          <div className="text-green text-4xl mb-4">✓</div>
          <p className="text-white font-semibold mb-2">Revisá tu email</p>
          <p className="text-[#555] text-sm">
            Te enviamos un enlace de confirmación a <span className="text-white">{verificationSent}</span>.
            El enlace expira en 24 horas. Si no lo encontrás, mirá tu casilla de Spam.
          </p>
          <button
            onClick={() => handleResendVerification(verificationSent)}
            disabled={resendStatus === 'sending' || resendStatus === 'sent'}
            className="mt-6 text-brand text-sm hover:underline disabled:opacity-50"
          >
            {resendStatus === 'sent' ? 'Enlace reenviado'
              : resendStatus === 'sending' ? 'Enviando...'
              : 'Reenviar enlace'}
          </button>
          <div>
            <button onClick={() => switchMode('login')}
              className="mt-3 text-[#555] text-sm hover:text-[#aaa] transition-colors">
              Volver al login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Vista de "olvidé mi contraseña"
  if (showForgot) {
    return (
      <div className="bg-base flex items-start justify-center pt-10 px-4">
        <div className="w-full max-w-sm">
          {forgotSent ? (
            <div className="mt-8 text-center">
              <div className="text-green text-4xl mb-4">✓</div>
              <p className="text-white font-semibold mb-2">Mail enviado</p>
              <p className="text-[#555] text-sm">Revisá tu casilla. El enlace expira en 1 hora.</p>
              <button onClick={() => switchMode('login')}
                className="mt-6 text-brand text-sm hover:underline">
                Volver al login
              </button>
            </div>
          ) : (
            <>
              <p className="text-[#555] text-sm mt-1 mb-8">Recuperá tu contraseña</p>
              <label className={label}>EMAIL</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]"
              />
              {error && <p className="text-danger text-xs font-mono mt-2">{error}</p>}
              <button onClick={handleForgot} disabled={loading}
                className="w-full mt-6 bg-brand text-base font-[Barlow_Condensed] font-black tracking-widest py-3 rounded text-sm disabled:opacity-50">
                {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
              </button>
              <button onClick={() => setShowForgot(false)}
                className="w-full mt-3 text-[#555] text-sm hover:text-[#aaa] transition-colors">
                Volver
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-base flex items-start justify-center pt-10 px-4">
      <div className="w-full max-w-sm">
        {sessionExpired && (
          <div className="mb-6 px-3.5 py-2.5 rounded border border-[#f0a84a44] bg-[#2e1f0a] text-[#f0a84a] text-xs font-mono">
            Tu sesión expiró. Por favor ingresá nuevamente.
          </div>
        )}

        <p className="text-[#555] text-sm mb-8">
          {isRegister ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}
        </p>

        {isRegister && (
          <>
            <label className={label}>NOMBRE</label>
            <input placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} minLength={6} maxLength={20}
              className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]" />
          </>
        )}

        <label className={label}>EMAIL</label>
        <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]" />

        <label className={label}>CONTRASEÑA</label>
        <PasswordInput value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
        {isRegister && <PasswordStrength password={password} />}

        {isRegister && (
          <>
            <label className={label}>REPETIR CONTRASEÑA</label>
            <PasswordInput
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {password2 && password !== password2 && (
              <p className="text-danger text-xs font-mono mt-1">Las contraseñas no coinciden</p>
            )}
          </>
        )}

        {!isRegister && (
          <div className="text-right mt-1">
            <button onClick={() => setShowForgot(true)}
              className="text-[#555] text-xs hover:text-[#aaa] font-mono transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {error && <p className="text-danger text-xs font-mono mt-3">{error}</p>}
        {needsVerification && !isRegister && (
          <button
            onClick={() => handleResendVerification(email)}
            disabled={resendStatus === 'sending' || resendStatus === 'sent'}
            className="mt-2 text-brand text-xs hover:underline disabled:opacity-50"
          >
            {resendStatus === 'sent' ? 'Enlace reenviado'
              : resendStatus === 'sending' ? 'Enviando...'
              : 'Reenviar enlace de confirmación'}
          </button>
        )}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full mt-5 bg-brand text-base font-[Barlow_Condensed] font-black tracking-widest py-3 rounded text-sm disabled:opacity-50 transition-opacity">
          {loading ? 'CARGANDO...' : isRegister ? 'REGISTRARSE' : 'INGRESAR'}
        </button>

        <div className="text-center my-4 text-[#333] text-xs font-mono">— o —</div>

        <div ref={googleDivRef} className="w-full flex justify-center" />

        <p className="text-center mt-5 text-sm text-[#555]">
          {isRegister ? (
            <>¿Ya tenés cuenta?{' '}
              <button onClick={() => switchMode('login')} className="text-brand hover:underline">Ingresá</button>
            </>
          ) : (
            <>¿No tenés cuenta?{' '}
              <button onClick={() => switchMode('register')} className="text-brand hover:underline">Registrate</button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}