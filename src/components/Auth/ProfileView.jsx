import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { fmt } from '../../utils/helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { Eye, EyeOff, Copy, Check, Camera, Trash2, ChevronDown, ChevronUp, X, Link, Flame, Trophy } from 'lucide-react';
import { siInstagram, siX, siFacebook, siWhatsapp } from 'simple-icons';
import FadeInCard from '../shared/FadeInCard';
import Loader from '../Loader/Loader';
import PlayerAvatar from '../shared/PlayerAvatar';
import AvatarCropper from '../shared/AvatarCropper';

const MAX_AVATAR_BYTES   = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function SiIcon({ icon, size = 14 }) {
  return (
    <svg role="img" viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d={icon.path} />
    </svg>
  );
}

const NETWORKS = [
  { id: 'instagram', label: 'Instagram',  prefix: 'https://www.instagram.com/', color: `#${siInstagram.hex}`, Icon: ({ size }) => <SiIcon icon={siInstagram} size={size} /> },
  { id: 'twitter',   label: 'Twitter / X', prefix: 'https://x.com/',            color: `#${siX.hex}`,         Icon: ({ size }) => <SiIcon icon={siX}         size={size} /> },
  { id: 'facebook',  label: 'Facebook',   prefix: 'https://www.facebook.com/',  color: `#${siFacebook.hex}`,  Icon: ({ size }) => <SiIcon icon={siFacebook}  size={size} /> },
  { id: 'whatsapp',  label: 'WhatsApp',   prefix: 'https://wa.me/54',             color: `#${siWhatsapp.hex}`,  Icon: ({ size }) => <SiIcon icon={siWhatsapp}  size={size} /> },
  { id: 'other',     label: 'Otro',       prefix: '',                           color: '#888',                Icon: ({ size }) => <Link size={size} /> },
];

const EMPTY_LINK = { network: '', url: '' };

function ensureTrailingEmpty(links) {
  const last = links[links.length - 1];
  if (!last || last.network !== '' || last.url !== '') return [...links, { ...EMPTY_LINK }];
  return links;
}

function NetworkPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const net = NETWORKS.find(n => n.id === value);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title={net?.label ?? 'Elegir red'}
        className="w-9 h-9 flex items-center justify-center bg-surface border border-border-mid rounded-sm cursor-pointer hover:border-border-strong transition-colors"
        style={{ color: net?.color ?? '#555' }}
      >
        {net ? <net.Icon size={15} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#111827] border border-border-mid rounded-sm p-1.5 flex gap-1 shadow-lg">
          {NETWORKS.map(n => (
            <button
              key={n.id}
              type="button"
              title={n.label}
              onClick={() => { onChange(n.id); setOpen(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-sm cursor-pointer border transition-colors"
              style={{
                color: n.color,
                borderColor: value === n.id ? n.color : 'transparent',
                background: value === n.id ? `${n.color}18` : 'transparent',
              }}
            >
              <n.Icon size={14} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialLinksEditor({ value, onChange }) {
  function updateLink(i, field, val) {
    const next = value.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
    if (field === 'network') {
      const net = NETWORKS.find(n => n.id === val);
      const old = NETWORKS.find(n => n.id === value[i].network);
      const curUrl = value[i].url;
      if (!curUrl || curUrl === (old?.prefix ?? '')) {
        next[i].url = net?.prefix ?? '';
      }
    }
    onChange(ensureTrailingEmpty(next.filter((l, idx) => {
      if (idx === next.length - 1) return true;
      return l.network !== '' || l.url !== '';
    })));
  }

  function removeLink(i) {
    onChange(ensureTrailingEmpty(value.filter((_, idx) => idx !== i)));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((link, i) => {
        const net = NETWORKS.find(n => n.id === link.network);
        const isLast = i === value.length - 1;
        return (
          <div key={i} className="flex items-center gap-2">
            <NetworkPicker value={link.network} onChange={val => updateLink(i, 'network', val)} />
            <input
              className="flex-1 bg-surface border border-border-mid text-white px-3 py-2 text-xs font-mono rounded-sm outline-none min-w-0"
              placeholder={net?.prefix ? `${net.prefix}usuario` : 'https://...'}
              value={link.url}
              onChange={e => updateLink(i, 'url', e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {!isLast && (
              <button type="button" onClick={() => removeLink(i)}
                className="shrink-0 text-[#555] hover:text-danger transition-colors bg-transparent border-none cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SocialLinksDisplay({ links }) {
  if (!links?.length) return null;
  const filtered = links.filter(l => l.url?.trim());
  if (!filtered.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {filtered.map((l, i) => {
        const net = NETWORKS.find(n => n.id === l.network);
        const prefix = net?.prefix ?? '';
        const display = prefix && l.url.startsWith(prefix) ? l.url.slice(prefix.length) : l.url;
        return (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-surface border border-border-mid rounded-full px-3 py-1 text-xs font-mono hover:border-border-strong transition-colors"
            style={{ color: net?.color ?? '#888', textDecoration: 'none' }}>
            {net && <net.Icon size={12} />}
            <span>{display || l.url}</span>
          </a>
        );
      })}
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder = '* * * * * * *' }) {
  const [show, setShow] = useState(false);
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
  );
}

function validatePassword(p) {
  if (p.length < 8)       return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(p))   return 'Al menos una mayúscula';
  if (!/[a-z]/.test(p))   return 'Al menos una minúscula';
  if (!/[0-9]/.test(p))   return 'Al menos un número';
  return null;
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 8,    label: '8+ chars' },
    { ok: /[A-Z]/.test(password),  label: 'Mayúscula' },
    { ok: /[a-z]/.test(password),  label: 'Minúscula' },
    { ok: /[0-9]/.test(password),  label: 'Número' },
  ];
  return (
    <div className="flex gap-1.5 flex-wrap mt-2">
      {checks.map(({ ok, label }) => (
        <span key={label} className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors
          ${ok ? 'text-green bg-[#1a2e1a] border-[#4af07a44]' : 'text-[#555] bg-[#111] border-border-strong'}`}>
          {ok ? '✓' : '○'} {label}
        </span>
      ))}
    </div>
  );
}

export default function ProfileView() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [editOpen,     setEditOpen]     = useState(false);
  const [editName,     setEditName]     = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [socialLinks,  setSocialLinks]  = useState([{ ...EMPTY_LINK }]);
  const [currentPass,  setCurrentPass]  = useState('');
  const [newPass,      setNewPass]      = useState('');
  const [newPass2,     setNewPass2]     = useState('');
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState(null);
  const [saveOk,       setSaveOk]       = useState(false);
  const [copied,       setCopied]       = useState(false);

  const fileInputRef = useRef(null);
  const [avatarUrl,   setAvatarUrl]   = useState(null);
  const [avatarBusy,  setAvatarBusy]  = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [cropFile,    setCropFile]    = useState(null);

  useEffect(() => {
    api.groups.byUsername(username)
      .then((d) => {
        setData(d);
        setEditName(d.owner.name);
        setEditUsername(d.owner.username);
        const existing = Array.isArray(d.owner.social_links) ? d.owner.social_links : [];
        setSocialLinks(ensureTrailingEmpty(existing));
        setAvatarUrl(d.owner.avatar_url ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <Loader />;
  if (error)   return <div className="text-danger p-10">{error}</div>;

  const { owner, groups, stats, recent_matches, frequent_partners } = data;
  const isOwnProfile  = user?.username === owner.username;
  const displayAvatar = avatarUrl ?? (isOwnProfile ? user?.avatar_url : null) ?? null;

  const savedLinks    = Array.isArray(owner.social_links) ? owner.social_links.filter(l => l.url?.trim()) : [];
  const filledLinks   = socialLinks.filter(l => {
    const url = l.url?.trim();
    if (!url) return false;
    const prefix = NETWORKS.find(n => n.id === l.network)?.prefix ?? '';
    return url !== prefix;
  });

  const hasChanges =
    editName.trim() !== owner.name ||
    editUsername.trim() !== owner.username ||
    newPass !== '' || currentPass !== '' ||
    JSON.stringify(filledLinks) !== JSON.stringify(savedLinks);

  function handleCancel() {
    setEditName(owner.name);
    setEditUsername(owner.username);
    setSocialLinks(ensureTrailingEmpty(savedLinks));
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
    if (!ALLOWED_MIME_TYPES.includes(file.type)) { setAvatarError('Formato no soportado. Usá jpeg, png o webp'); return; }
    if (file.size > MAX_AVATAR_BYTES) { setAvatarError('La imagen excede el tamaño máximo (5 MB)'); return; }
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

    if (JSON.stringify(filledLinks) !== JSON.stringify(savedLinks)) {
      body.social_links = filledLinks;
    }

    if (Object.keys(body).length === 0) return;

    setSaving(true);
    try {
      const updated = await api.auth.updateMe(body);
      const newUsername = updated.username ?? user.username;
      login({ ...user, name: updated.name ?? user.name, username: newUsername });
      setData(d => ({
        ...d,
        owner: {
          ...d.owner,
          name: updated.name ?? d.owner.name,
          username: newUsername,
          social_links: updated.social_links ?? d.owner.social_links,
        },
      }));
      setSocialLinks(ensureTrailingEmpty(updated.social_links ?? filledLinks));
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

        {/* Cabecera */}
        <div className="mb-6 flex justify-between items-start gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative">
              <PlayerAvatar
                name={owner.name}
                src={displayAvatar}
                size={72}
                premium={isOwnProfile ? user?.subscription?.plan === 'premium' : owner.is_premium}
              />
              {isOwnProfile && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    className="hidden" onChange={handleAvatarChange} />
                  <button type="button" onClick={pickAvatar} disabled={avatarBusy}
                    title={displayAvatar ? 'Cambiar foto' : 'Subir foto'}
                    className="absolute -bottom-1 -right-1 bg-brand text-base rounded-full w-7 h-7 flex items-center justify-center border-2 border-base cursor-pointer hover:brightness-110 transition disabled:opacity-50 disabled:cursor-wait">
                    <Camera size={13} />
                  </button>
                  {displayAvatar && (
                    <button type="button" onClick={handleAvatarDelete} disabled={avatarBusy} title="Quitar foto"
                      className="absolute -top-1 -right-1 bg-surface text-muted rounded-full w-6 h-6 flex items-center justify-center border border-border-strong cursor-pointer hover:text-danger hover:border-danger transition disabled:opacity-50 disabled:cursor-wait">
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
              {avatarError && <div className="text-[11px] text-danger font-mono mt-1">{avatarError}</div>}
              <SocialLinksDisplay links={savedLinks} />
            </div>
          </div>
        </div>

        {/* Editar perfil (colapsable) */}
        {isOwnProfile && (
          <div className="bg-surface border border-border-mid rounded-lg mb-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setEditOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 cursor-pointer bg-transparent border-none text-left"
            >
              <span className="font-condensed font-bold text-sm tracking-[3px] text-[#555]">EDITAR PERFIL</span>
              {editOpen ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
            </button>

            {editOpen && (
              <div className="px-5 pb-5">
                <label style={label}>NOMBRE</label>
                <input
                  className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]"
                  value={editName} onChange={e => setEditName(e.target.value)} minLength={6} maxLength={20}
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
                <div className="w-full bg-surface border border-border-mid text-muted px-3.5 py-2.5 rounded text-sm font-[Barlow]">
                  {user?.email}
                </div>

                <label style={label}>REDES SOCIALES</label>
                <SocialLinksEditor value={socialLinks} onChange={setSocialLinks} />

                <div style={{ borderTop: '1px solid #222', marginTop: 20, paddingTop: 4 }}>
                  <div style={{ fontSize: 11, color: '#444', fontFamily: "'Kode Mono',monospace", marginBottom: 4 }}>
                    Dejá en blanco si no querés cambiar la contraseña
                  </div>
                  <label style={label}>CONTRASEÑA ACTUAL</label>
                  <PasswordInput value={currentPass} onChange={e => setCurrentPass(e.target.value)} />

                  <label style={label}>NUEVA CONTRASEÑA</label>
                  <PasswordInput value={newPass} onChange={e => setNewPass(e.target.value)} />
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
          </div>
        )}

        {/* Estadísticas */}
        {stats && (stats.torneos > 0 || stats.partidos > 0) && (() => {
          const pct = stats.partidos > 0 ? Math.round((stats.victorias / stats.partidos) * 100) : 0;
          const pctColor = pct >= 60 ? '#4af07a' : pct >= 40 ? '#e8f04a' : '#f07a4a';
          return (
            <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
              <div className="font-condensed font-bold text-sm tracking-[3px] text-[#555] mb-4">ESTADÍSTICAS PERSONALES</div>

              {/* Main counters */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'TORNEOS JUGADOS', value: stats.torneos, color: '#4ab8f0' },
                  { label: 'PARTIDOS', value: stats.partidos, color: '#4af07a' },
                ].map(({ label: l, value, color }) => (
                  <div key={l} className="bg-base rounded-lg px-4 py-3 border border-border-strong">
                    <div className="font-condensed font-black text-[32px] text-white leading-none">{value}</div>
                    <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>{l}</div>
                    <div className="h-0.5 rounded-full mt-2" style={{ background: color, opacity: 0.35 }} />
                  </div>
                ))}
              </div>

              {/* Win percentage */}
              {stats.partidos > 0 && (
                <div className="bg-base rounded-lg px-4 py-3 border border-border-strong mb-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-mono tracking-widest" style={{ color: '#555' }}>% VICTORIAS</span>
                    <span className="font-condensed font-black text-[22px] leading-none" style={{ color: pctColor }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#111' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pctColor, transition: 'width 0.5s ease' }} />
                  </div>
                  <div className="text-[10px] font-mono mt-1.5" style={{ color: '#444' }}>
                    {stats.victorias} {stats.victorias === 1 ? 'victoria' : 'victorias'} de {stats.partidos} partidos
                  </div>
                </div>
              )}

              {/* Win streak */}
              {(stats.racha > 0 || stats.racha_max > 0) && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg px-4 py-3 border flex items-center justify-between"
                    style={{ background: stats.racha > 0 ? '#e8f04a0a' : undefined, borderColor: stats.racha > 0 ? '#e8f04a33' : undefined }}>
                    <div>
                      <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: '#888' }}>RACHA ACTUAL</div>
                      <div className="font-condensed font-black text-[28px] leading-none" style={{ color: stats.racha > 0 ? '#e8f04a' : '#333' }}>
                        {stats.racha}
                      </div>
                      <div className="text-[10px] font-mono mt-1" style={{ color: '#555' }}>
                        {stats.racha === 1 ? 'victoria' : 'victorias'}
                      </div>
                    </div>
                    <Flame size={22} style={{ color: stats.racha > 0 ? '#e8f04a' : '#333' }} className="shrink-0" />
                  </div>
                  <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
                    <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: '#888' }}>RACHA MÁXIMA</div>
                    <div className="font-condensed font-black text-[28px] text-white leading-none">{stats.racha_max ?? 0}</div>
                    <div className="text-[10px] font-mono mt-1" style={{ color: '#555' }}>
                      {(stats.racha_max ?? 0) === 1 ? 'victoria' : 'victorias'}
                    </div>
                  </div>
                </div>
              )}

              {/* Americano stats */}
              {stats.torneos_americanos > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
                    <div className="font-condensed font-black text-[32px] text-white leading-none">{stats.torneos_americanos}</div>
                    <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>AMERICANOS</div>
                    <div className="h-0.5 rounded-full mt-2" style={{ background: '#a84af0', opacity: 0.35 }} />
                  </div>
                  <div className="bg-base rounded-lg px-4 py-3 border"
                    style={{ borderColor: stats.campeon_americano > 0 ? '#f0d04a44' : undefined }}>
                    <div className="flex items-start justify-between">
                      <div className="font-condensed font-black text-[32px] leading-none"
                        style={{ color: stats.campeon_americano > 0 ? '#f0d04a' : '#333' }}>
                        {stats.campeon_americano}
                      </div>
                      {stats.campeon_americano > 0 && <Trophy size={16} style={{ color: '#f0d04a', marginTop: 2 }} />}
                    </div>
                    <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>
                      {stats.campeon_americano === 1 ? 'VEZ CAMPEÓN' : 'VECES CAMPEÓN'}
                    </div>
                    <div className="h-0.5 rounded-full mt-2" style={{ background: '#f0d04a', opacity: stats.campeon_americano > 0 ? 0.35 : 0.08 }} />
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Últimos partidos */}
        {recent_matches?.length > 0 && (
          <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
            <div className="font-condensed font-bold text-sm tracking-[3px] text-[#555] mb-3">ÚLTIMOS 5 PARTIDOS</div>
            <div className="flex flex-col gap-2">
              {recent_matches.map((m) => {
                const win  = m.result === 'win';
                const draw = m.result === 'draw';
                const color = win ? '#4af07a' : draw ? '#e8f04a' : '#f07a4a';
                const firstName = (n) => n?.split(' ')[0] ?? '?';
                return (
                  <div key={m.id} onClick={() => navigate(`/cat/${m.group_id}/torneo/${m.tournament_id}`)}
                    className="bg-base rounded-lg px-3 py-2.5 border border-border-strong flex items-center gap-3 cursor-pointer hover:border-border-mid transition-colors">
                    {/* Result badge */}
                    <div className="shrink-0 w-8 h-8 rounded flex items-center justify-center font-condensed font-black text-[13px]"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
                      {win ? 'V' : draw ? 'E' : 'D'}
                    </div>
                    {/* Score */}
                    <div className="shrink-0 font-condensed font-black text-[20px] leading-none w-12 text-center"
                      style={{ color }}>
                      {m.my_score}<span className="text-[#fff] font-normal text-[20px]"> - </span>{m.opp_score}
                    </div>
                    {/* Players */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-white font-mono truncate">
                        <span className="text-muted">con </span>{firstName(m.partner_name)}
                        <span className="text-[#444]"> vs </span>
                        {firstName(m.opp1_name)} & {firstName(m.opp2_name)}
                      </div>
                      <div className="text-[10px] text-dim font-mono mt-0.5 truncate">{m.tournament_name}</div>
                    </div>
                    {/* Date */}
                    <div className="shrink-0 text-[10px] text-dim font-mono">{m.played_at?.slice(0, 10)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Compañeros frecuentes */}
        {frequent_partners?.length > 0 && (
          <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
            <div className="font-condensed font-bold text-sm tracking-[3px] text-[#555] mb-3">COMPAÑEROS FRECUENTES</div>
            <div className="rounded-lg overflow-hidden border border-border-strong">
              {frequent_partners.map((p, i) => (
                <div key={i}
                  onClick={() => p.username && navigate(`/u/${p.username}`)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-border-strong last:border-b-0 transition-colors ${p.username ? 'cursor-pointer hover:bg-surface' : ''}`}
                  style={{ background: '#0d0d0d' }}>
                  <div className="shrink-0 font-condensed font-black text-[13px] w-4 text-center" style={{ color: '#333' }}>
                    {i + 1}
                  </div>
                  <PlayerAvatar name={p.name} src={p.avatar_url} size={32} premium={p.is_premium} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-mono truncate ${p.username ? 'text-white' : 'text-muted'}`}>
                      {p.name}
                    </div>
                    {p.username && (
                      <div className="text-[10px] font-mono text-dim">@{p.username}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-condensed font-black text-[18px] text-white leading-none">{p.partidos_juntos}</div>
                    <div className="text-[10px] font-mono text-dim">{p.partidos_juntos === 1 ? 'partido' : 'partidos'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categorías */}
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-4">CATEGORÍAS PROPIAS</div>
        {groups.length === 0 && (
          <div className="text-center text-dim py-10 px-5 font-sans leading-loose">
            Este usuario no tiene categorías públicas.
          </div>
        )}
        <div className="flex flex-col gap-2.5">
          {groups.map((g, i) => (
            <FadeInCard key={g.id} delay={i * 60}
              className="border border-border-mid rounded-lg cursor-pointer hover:border-border-strong transition-colors overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #222222 100%)' }}
              onClick={() => navigate(`/cat/${g.id}`)}>
              {g.emojis?.length > 0 && (
                <div className="inline-flex px-3 pt-2 pb-1.5 text-base border-b border-r bg-surface border-border-mid rounded-br-lg leading-none">
                  {g.emojis.join(' ')}
                </div>
              )}
              <div className="px-5 py-4">
                <div className="font-condensed font-bold text-[18px] text-white mb-1">{g.name}</div>
                {g.description && <div className="text-[13px] text-[#666] mb-1.5">{g.description}</div>}
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
