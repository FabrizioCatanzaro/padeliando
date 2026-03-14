import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '../../utils/api'

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

export default function ResetPassword() {
  const { token }           = useParams()
  const navigate            = useNavigate()
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)

  async function handleSubmit() {
    const pwErr = validatePassword(password)
    if (pwErr) { return }
    if (password !== password2) { return }
    setLoading(true)
    try {
      await api.auth.resetPassword(token, password)
      setDone(true)
    } catch (err){
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const label = 'block text-[11px] tracking-widest text-[#555] font-mono mb-1.5 mt-4'

  return (
    <div className="bg-base flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-sm">
        <div className="font-[Barlow_Condensed] font-black text-2xl tracking-widest text-white mb-1 cursor-pointer"
          onClick={() => navigate('/')}>
          PADEL<span className="text-base">EANDO</span>
        </div>

        {done ? (
          <div className="mt-8 text-center">
            <div className="text-green text-4xl mb-4">✓</div>
            <p className="text-white font-semibold mb-2">Contraseña actualizada</p>
            <p className="text-[#555] text-sm mb-6">Ya podés ingresar con tu nueva contraseña.</p>
            <button onClick={() => navigate('/login')}
              className="bg-brand text-base font-[Barlow_Condensed] font-black tracking-widest px-6 py-2.5 rounded text-sm cursor-pointer">
              IR AL LOGIN
            </button>
          </div>
        ) : (
          <>
            <p className="text-[#555] text-sm mt-1 mb-8">Ingresá tu nueva contraseña</p>
            <label className={label}>NUEVA CONTRASEÑA</label>
            <PasswordInput value={password} onChange={e => setPassword(e.target.value)} />
            <PasswordStrength password={password} />
            <label className={label}>REPETIR CONTRASEÑA</label>
            <PasswordInput value={password2} onChange={e => setPassword2(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
            {password2 && password !== password2 && (
              <div style={{ fontSize: 11, color: '#e05252', fontFamily: "'Kode Mono',monospace", marginTop: 4 }}>
                Las contraseñas no coinciden
              </div>
            )}
            <button onClick={handleSubmit} disabled={loading}
              className="cursor-pointer w-full mt-5 bg-brand text-base font-[Barlow_Condensed] font-black tracking-widest py-3 rounded text-sm disabled:opacity-50">
              {loading ? 'GUARDANDO...' : 'RESTABLECER CONTRASEÑA'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}