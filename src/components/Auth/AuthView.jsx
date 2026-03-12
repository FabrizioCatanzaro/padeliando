import { useState } from 'react';
import S, { FONTS } from '../../styles/theme';
import { api } from '../../utils/api';
import { saveSession } from '../../utils/auth';
import { Eye, EyeOff } from 'lucide-react';

function validatePassword(password) {
  if (password.length < 8)       return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(password))   return 'Al menos una mayúscula';
  if (!/[a-z]/.test(password))   return 'Al menos una minúscula';
  if (!/[0-9]/.test(password))   return 'Al menos un número';
  return null;
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 8,      label: '8+ caracteres' },
    { ok: /[A-Z]/.test(password),    label: '1 mayúscula' },
    { ok: /[a-z]/.test(password),    label: '1 minúscula' },
    { ok: /[0-9]/.test(password),    label: '1 número' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {checks.map(({ ok, label }) => (
        <span key={label} style={{
          fontSize: 10, fontFamily: "'Courier New',monospace",
          color: ok ? '#4af07a' : '#555',
          background: ok ? '#1a2e1a' : '#111',
          border: `1px solid ${ok ? '#4af07a44' : '#2a3040'}`,
          padding: '2px 7px', borderRadius: 3,
        }}>
          {ok ? '✓' : '○'} {label}
        </span>
      ))}
    </div>
  );
}

export default function AuthView({ mode: initialMode }) {
  const [mode,      setMode]      = useState(initialMode);
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [error,     setError]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const isRegister = mode === 'register';

  function getFormError() {
    if (isRegister) {
      const pwErr = validatePassword(password);
      if (pwErr) return pwErr;
      if (password !== password2) return 'Las contraseñas no coinciden';
    }
    return null;
  }

  async function handleSubmit() {
    setError(null);
    const formErr = getFormError();
    if (formErr) { setError(formErr); return; }

    setLoading(true);
    try {
      const body = isRegister ? { name, email, password } : { email, password };
      const fn   = isRegister ? api.auth.register : api.auth.login;
      const { user } = await fn(body);
      saveSession(user);
      window.location.hash = '/';
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        try {
          const { user } = await api.auth.google(credential);
          saveSession(user);
          window.location.hash = '/';
        } catch (e) {
          setError(e.message);
        }
      },
    });
    window.google.accounts.id.prompt();
  }

  function switchMode(m) {
    setMode(m);
    setError(null);
    setPassword('');
    setPassword2('');
  }

  return (
    <div style={S.page}>
      <style>{FONTS}</style>
      <div style={S.setupCard}>
        <div style={{ ...S.logo, fontSize: 28, marginBottom: 4, cursor: "pointer" }} onClick={() => { window.location = '/'; }}>
          🎾 PADEL<span style={{ color: '#e8f04a' }}>EANDO</span>
        </div>
        <p style={S.subtitle}>
          {isRegister ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}
        </p>

        {isRegister && (
          <>
            <label style={S.label}>NOMBRE</label>
            <input style={S.input} placeholder="Tu nombre"
              value={name} onChange={(e) => setName(e.target.value)} />
          </>
        )}

        <label style={S.label}>EMAIL</label>
        <input style={S.input} type="email" placeholder="tu@email.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <label style={S.label}>CONTRASEÑA</label>
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...S.input, marginBottom: 0, paddingRight: 40 }}
            type={showPass ? 'text' : 'password'}
            placeholder="········"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={() => setShowPass((v) => !v)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: '#555', display: 'flex', alignItems: 'center',
            }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {isRegister && <PasswordStrength password={password} />}

        {isRegister && (
          <>
            <label style={S.label}>REPETIR CONTRASEÑA</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{
                  ...S.input, marginBottom: 0, paddingRight: 40,
                  borderColor: password2 && password !== password2 ? '#f04a4a' : '#1a2030',
                }}
                type={showPass2 ? 'text' : 'password'}
                placeholder="········"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={() => setShowPass2((v) => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: '#555', display: 'flex', alignItems: 'center',
                }}
              >
                {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password2 && password !== password2 && (
              <div style={{ fontSize: 11, color: '#f04a4a', fontFamily: "'Courier New',monospace", marginTop: 4 }}>
                Las contraseñas no coinciden
              </div>
            )}
          </>
        )}

        {!isRegister && (
          // En login el Enter también envía
          <input style={{ display: 'none' }} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
        )}

        {error && (
          <div style={{ color: '#f04a4a', fontSize: 12, fontFamily: "'Courier New',monospace", marginTop: 10 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ ...S.createBtn, opacity: loading ? 0.5 : 1 }}
        >
          {loading ? 'CARGANDO...' : isRegister ? 'REGISTRARSE' : 'INGRESAR'}
        </button>

        <div style={{ textAlign: 'center', margin: '16px 0', color: '#333',
                      fontSize: 12, fontFamily: "'Courier New',monospace" }}>— o —</div>

        <button onClick={handleGoogle} style={{
          width: '100%', background: '#fff', color: '#333', border: 'none',
          padding: '11px', borderRadius: 4, cursor: 'pointer', fontSize: 14,
          fontFamily: "'Barlow',sans-serif", fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <img src="https://www.google.com/favicon.ico" alt="" style={{ width: 16, height: 16 }} />
          Continuar con Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#555' }}>
          {isRegister ? (
            <>¿Ya tenés cuenta?{' '}
              <span style={{ color: '#e8f04a', cursor: 'pointer' }} onClick={() => switchMode('login')}>
                Ingresá
              </span>
            </>
          ) : (
            <>¿No tenés cuenta?{' '}
              <span style={{ color: '#e8f04a', cursor: 'pointer' }} onClick={() => switchMode('register')}>
                Registrate
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}