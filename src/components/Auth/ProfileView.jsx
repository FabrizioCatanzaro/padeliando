import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { fmt } from '../../utils/helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { Eye, EyeOff, Copy, Check, Camera, Trash2 } from 'lucide-react';
import FadeInCard from '../shared/FadeInCard';
import Loader from '../Loader/Loader';
import PlayerAvatar from '../shared/PlayerAvatar';
import AvatarCropper from '../shared/AvatarCropper';

const MAX_AVATAR_BYTES  = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function PasswordInput({ value, onChange, placeholder = '* * * * * * *' }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none pr-10 font-[Barlow]"
      />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors bg-transparent border-0 cursor-pointer">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

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

export default function ProfileView() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // edit state
  const [editName,     setEditName]     = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [currentPass,  setCurrentPass]  = useState('');
  const [newPass,      setNewPass]      = useState('');
  const [newPass2,     setNewPass2]     = useState('');
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState(null);
  const [saveOk,       setSaveOk]       = useState(false);
  const [copied,       setCopied]       = useState(false);

  // avatar state
  const fileInputRef = useRef(null);
  const [avatarUrl,      setAvatarUrl]      = useState(null);
  const [avatarBusy,     setAvatarBusy]     = useState(false);
  const [avatarError,    setAvatarError]    = useState(null);
  const [cropFile,       setCropFile]       = useState(null);

  useEffect(() => {
    api.groups.byUsername(username)
      .then((d) => {
        setData(d);
        setEditName(d.owner.name);
        setEditUsername(d.owner.username);
        setAvatarUrl(d.owner.avatar_url ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <Loader />;
  if (error)   return <div className="text-danger p-10">{error}</div>;

  const { owner, groups, stats } = data;
  const isOwnProfile = user?.username === owner.username;
  const displayAvatar = avatarUrl ?? (isOwnProfile ? user?.avatar_url : null) ?? null;

  const hasChanges =
    editName.trim() !== owner.name ||
    editUsername.trim() !== owner.username ||
    newPass !== '' ||
    currentPass !== '';

  function handleCancel() {
    setEditName(owner.name);
    setEditUsername(owner.username);
    setCurrentPass(''); setNewPass(''); setNewPass2('');
    setSaveError(null); setSaveOk(false);
  }

  function handleCopyUsername() {
    navigator.clipboard.writeText(editUsername);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function pickAvatar() {
    if (avatarBusy) return;
    setAvatarError(null);
    fileInputRef.current?.click();
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setAvatarError('Formato no soportado. Usá jpeg, png o webp');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('La imagen excede el tamaño máximo (5 MB)');
      return;
    }

    setAvatarError(null);
    setCropFile(file);
  }

  async function handleCropSave(blob) {
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      const cropped = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const updated = await api.auth.uploadAvatar(cropped);
      setAvatarUrl(updated.avatar_url);
      if (isOwnProfile) login({ ...user, avatar_url: updated.avatar_url });
      setCropFile(null);
    } catch (err) {
      setAvatarError(err.message);
      throw err;
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleAvatarDelete() {
    if (avatarBusy) return;
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      await api.auth.deleteAvatar();
      setAvatarUrl(null);
      if (isOwnProfile) login({ ...user, avatar_url: null });
    } catch (err) {
      setAvatarError(err.message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleSave() {
    setSaveError(null); setSaveOk(false);
    const body = {};

    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== owner.name) body.name = trimmedName;

    const trimmedUsername = editUsername.trim();
    if (trimmedUsername && trimmedUsername !== owner.username) body.username = trimmedUsername;

    if (newPass) {
      const pwErr = validatePassword(newPass);
      if (pwErr) { setSaveError(pwErr); return; }
      if (newPass !== newPass2) { setSaveError('Las contraseñas no coinciden'); return; }
      if (!currentPass) { setSaveError('Ingresá tu contraseña actual'); return; }
      body.current_password = currentPass;
      body.new_password = newPass;
    }

    setSaving(true);
    try {
      const updated = await api.auth.updateMe(body);
      const newUsername = updated.username ?? user.username;
      // update context & localStorage so header stays in sync
      login({ ...user, name: updated.name ?? user.name, username: newUsername });
      setData(d => ({
        ...d,
        owner: { ...d.owner, name: updated.name ?? d.owner.name, username: newUsername },
      }));
      setSaveOk(true);
      setCurrentPass(''); setNewPass(''); setNewPass2('');
      setTimeout(() => {
        setSaveOk(false);
        if (newUsername !== username) navigate(`/u/${newUsername}`, { replace: true });
      }, 1200);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const label = { display: 'block', fontSize: 11, letterSpacing: 2, color: '#555',
                  fontFamily: "'Kode Mono',monospace", marginBottom: 6, marginTop: 16 };

  return (
    <div className="bg-base text-content font-sans pb-15">
      <div className="p-6">

        {/* Cabecera de perfil */}
        <div className="mb-6 flex justify-between items-start gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative">
              <PlayerAvatar name={owner.name} src={displayAvatar} size={72} />
              {isOwnProfile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={pickAvatar}
                    disabled={avatarBusy}
                    title={displayAvatar ? 'Cambiar foto' : 'Subir foto'}
                    className="absolute -bottom-1 -right-1 bg-brand text-base rounded-full w-7 h-7 flex items-center justify-center border-2 border-base cursor-pointer hover:brightness-110 transition disabled:opacity-50 disabled:cursor-wait"
                  >
                    <Camera size={13} />
                  </button>
                  {displayAvatar && (
                    <button
                      type="button"
                      onClick={handleAvatarDelete}
                      disabled={avatarBusy}
                      title="Quitar foto"
                      className="absolute -top-1 -right-1 bg-surface text-muted rounded-full w-6 h-6 flex items-center justify-center border border-border-strong cursor-pointer hover:text-danger hover:border-danger transition disabled:opacity-50 disabled:cursor-wait"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </>
              )}
            </div>
            <div>
              <div className="font-condensed font-bold text-[28px] text-white">{owner.name}</div>
              <div className="text-[12px] text-muted font-mono mt-1">
                @{owner.username} · desde {fmt(owner.created_at)}
              </div>
              {avatarError && (
                <div className="text-[11px] text-danger font-mono mt-1">{avatarError}</div>
              )}
            </div>
          </div>
        </div>

        {/* Formulario de edición */}
        {isOwnProfile && (
          <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
            <div className="font-condensed font-bold text-sm tracking-[3px] text-[#555] mb-2">EDITAR PERFIL</div>

            <label style={label}>NOMBRE</label>
            <input
              className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              minLength={6} maxLength={20}
            />
            <label style={label}>NOMBRE DE USUARIO</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555] text-sm font-mono select-none">@</span>
              <input
                className="w-full bg-surface border border-border-mid text-white pl-7 pr-10 py-2.5 rounded text-sm outline-none font-mono"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                minLength={3} maxLength={20}
              />
              <button type="button" onClick={handleCopyUsername}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors bg-transparent border-0 cursor-pointer">
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
            <label style={label}>MAIL</label>
            <div
              className="w-full bg-surface border border-border-mid text-muted px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]"
            >{user?.email}</div>

            <div style={{ borderTop: '1px solid #222222', marginTop: 20, paddingTop: 4 }}>
              <div style={{ fontSize: 11, color: '#444', fontFamily: "'Kode Mono',monospace", marginBottom: 4 }}>
                Dejá en blanco si no querés cambiar la contraseña
              </div>
              <label style={label}>CONTRASEÑA ACTUAL</label>
              <PasswordInput value={currentPass} onChange={e => setCurrentPass(e.target.value)} />

              <label style={label}>NUEVA CONTRASEÑA</label>
              <PasswordInput value={newPass} onChange={e => setNewPass(e.target.value) }/>
              {newPass && <PasswordStrength password={newPass} />}

              <label style={label}>REPETIR NUEVA CONTRASEÑA</label>
              <PasswordInput value={newPass2} onChange={e => setNewPass2(e.target.value)} />
              {newPass2 && newPass !== newPass2 && (
                <div style={{ fontSize: 11, color: '#e05252', fontFamily: "'Kode Mono',monospace", marginTop: 4 }}>
                  Las contraseñas no coinciden
                </div>
              )}
            </div>

            {saveError && (
              <div style={{ fontSize: 12, color: '#e05252', fontFamily: "'Kode Mono',monospace", marginTop: 12 }}>
                {saveError}
              </div>
            )}
            {saveOk && (
              <div style={{ fontSize: 12, color: '#4af07a', fontFamily: "'Kode Mono',monospace", marginTop: 12 }}>
                ✓ Guardado
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving || !hasChanges}
                style={{ flex: 1, background: '#e8f04a', color: '#0a0e1a', border: 'none', padding: '10px',
                         fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 14,
                         letterSpacing: 2, borderRadius: 4, cursor: saving || !hasChanges ? 'default' : 'pointer',
                         opacity: saving || !hasChanges ? 0.4 : 1 }}>
                {saving ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
              <button onClick={handleCancel}
                className="bg-transparent border border-border-strong text-[#555] px-4 py-2 text-xs rounded cursor-pointer hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas generales como jugador */}
        {stats && (stats.torneos > 0 || stats.partidos > 0) && (
          <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
            <div className="font-condensed font-bold text-sm tracking-[3px] text-[#555] mb-4">ESTADÍSTICAS</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'TORNEOS', value: stats.torneos },
                { label: 'PARTIDOS', value: stats.partidos },
                { label: 'VICTORIAS', value: stats.victorias },
              ].map(({ label: l, value }) => (
                <div key={l} className="text-center">
                  <div className="font-condensed font-bold text-[28px] text-white leading-none">{value}</div>
                  <div className="text-[10px] font-mono text-[#444] mt-1 tracking-widest">{l}</div>
                </div>
              ))}
            </div>
            {stats.partidos > 0 && (
              <div className="mt-4 pt-3 border-t border-border-mid">
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 rounded-full bg-brand"
                    style={{ width: `${Math.round((stats.victorias / stats.partidos) * 100)}%`, transition: 'width 0.4s' }}
                  />
                  <span className="text-[11px] font-mono text-[#555] whitespace-nowrap">
                    {Math.round((stats.victorias / stats.partidos) * 100)}% victorias
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de torneos */}
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-4">CATEGORÍAS PROPIAS</div>

        {groups.length === 0 && (
          <div className="text-center text-dim py-10 px-5 font-sans leading-loose">Este usuario no tiene categorías públicas.</div>
        )}

        <div className="flex flex-col gap-2.5">
          {groups.map((g, i) => (
            <FadeInCard key={g.id} delay={i * 60}
              className="border border-border-mid rounded-lg cursor-pointer hover:border-border-strong transition-colors overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #222222 100%)' }}
              onClick={() => { navigate(`/cat/${g.id}`); }}>
              {g.emojis?.length > 0 && (
                <div className="inline-flex px-3 pt-2 pb-1.5 text-base border-b border-r bg-surface border-border-mid rounded-br-lg leading-none">
                  {g.emojis.join(' ')}
                </div>
              )}
              <div className="px-5 py-4">
                <div className="font-condensed font-bold text-[18px] text-white mb-1">{g.name}</div>
                {g.description && (
                  <div className="text-[13px] text-[#666] mb-1.5">{g.description}</div>
                )}
                <div className="text-[11px] text-dim font-mono">
                  {g.player_count} jugadores · {g.tournament_count} torneos
                </div>
              </div>
            </FadeInCard>
          ))}
        </div>
      </div>

      {cropFile && (
        <AvatarCropper
          file={cropFile}
          onCancel={() => { if (!avatarBusy) setCropFile(null); }}
          onSave={handleCropSave}
        />
      )}
    </div>
  );
}
