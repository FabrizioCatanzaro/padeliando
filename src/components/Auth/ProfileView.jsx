import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { fmt } from '../../utils/helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { Eye, EyeOff, Copy, Check, Camera, Trash2, ChevronDown, ChevronUp, X, Link, Flame, Trophy, UserPlus, UserCheck, Lock, Gem, Badge, BadgeCheck } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { siInstagram, siX, siFacebook, siWhatsapp } from 'simple-icons';
import FadeInCard from '../shared/FadeInCard';
import PremiumModal from '../shared/PremiumModal';
import statsPreview from '../../assets/advanced-stats-preview.svg';
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

// ── Tooltip personalizado para recharts ───────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-border-strong rounded px-3 py-2 text-xs font-mono">
      <div className="text-muted mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}{p.unit ?? ''}</div>
      ))}
    </div>
  );
}

// ── Heatmap de actividad ──────────────────────────────────────────────────────
const HEATMAP_COLORS = [
  '#111',                    // 0 — sin actividad
  'rgba(232,240,74,0.22)',   // 1
  'rgba(232,240,74,0.45)',   // 2
  'rgba(232,240,74,0.70)',   // 3
  '#e8f04a',                 // 4+
];

function heatColor(n) {
  if (n <= 0) return HEATMAP_COLORS[0];
  if (n === 1) return HEATMAP_COLORS[1];
  if (n === 2) return HEATMAP_COLORS[2];
  if (n === 3) return HEATMAP_COLORS[3];
  return HEATMAP_COLORS[4];
}

function ActivityHeatmap({ dailyActivity }) {
  const activityMap = Object.fromEntries((dailyActivity ?? []).map(d => [d.day, d.partidos]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Arrancar desde el lunes de hace 52 semanas
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  const dow = start.getDay();
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks = [];
  const cur = new Date(start);
  while (cur <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      const isFuture = cur > today;
      week.push({
        date: dateStr,
        n: isFuture ? -1 : (activityMap[dateStr] ?? 0),
        label: isFuture ? '' : cur.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' }),
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  // Etiquetas de mes (primer semana visible de cada mes)
  const monthLabels = [];
  weeks.forEach((week, wi) => {
    const d = new Date(week[0].date);
    if (d.getDate() <= 7 && (!monthLabels.length || monthLabels[monthLabels.length - 1].wi !== wi - 1)) {
      monthLabels.push({ wi, label: d.toLocaleDateString('es-AR', { month: 'short' }) });
    }
  });

  const CELL = 11;
  const GAP  = 2;
  const STEP = CELL + GAP;
  const DAY_LABELS = ['Lun', '', 'Mié', '', 'Vie', '', ''];

  return (
    <div>
      <div className="text-[10px] font-mono tracking-[2px] text-muted mb-3">ACTIVIDAD (ÚLTIMOS 12 MESES)</div>
      <div className="overflow-x-auto pb-2">
        <div style={{ display: 'inline-flex', flexDirection: 'column', minWidth: 'max-content' }}>
          {/* Etiquetas de mes */}
          <div style={{ display: 'flex', marginLeft: 28, marginBottom: 3 }}>
            {weeks.map((_, wi) => {
              const lbl = monthLabels.find(m => m.wi === wi);
              return (
                <div key={wi} style={{ width: STEP, flexShrink: 0, fontSize: 9, color: '#555', fontFamily: 'monospace' }}>
                  {lbl?.label ?? ''}
                </div>
              );
            })}
          </div>
          {/* Filas (días) */}
          {Array.from({ length: 7 }, (_, di) => (
            <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: GAP }}>
              <div style={{ width: 26, fontSize: 8, color: '#444', fontFamily: 'monospace', textAlign: 'right', paddingRight: 4, flexShrink: 0 }}>
                {DAY_LABELS[di]}
              </div>
              {weeks.map((week, wi) => {
                const cell = week[di];
                if (!cell) return <div key={wi} style={{ width: CELL, height: CELL, marginRight: GAP }} />;
                return (
                  <div
                    key={wi}
                    title={cell.n > 0 ? `${cell.label}: ${cell.n} ${cell.n === 1 ? 'partido' : 'partidos'}` : cell.label || ''}
                    style={{
                      width: CELL, height: CELL,
                      borderRadius: 2,
                      background: cell.n < 0 ? 'transparent' : heatColor(cell.n),
                      marginRight: GAP,
                      flexShrink: 0,
                    }}
                  />
                );
              })}
            </div>
          ))}
          {/* Leyenda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6, marginLeft: 28 }}>
            <span style={{ fontSize: 9, color: '#444', fontFamily: 'monospace', marginRight: 2 }}>Menos</span>
            {HEATMAP_COLORS.map((bg, i) => (
              <div key={i} style={{ width: CELL, height: CELL, borderRadius: 2, background: bg, flexShrink: 0 }} />
            ))}
            <span style={{ fontSize: 9, color: '#444', fontFamily: 'monospace', marginLeft: 2 }}>Más</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Estadísticas avanzadas (premium) ─────────────────────────────────────────
function AdvancedStats({ stats, monthlyStats, dailyActivity }) {
  const gf   = stats.games_favor  ?? 0;
  const gc   = stats.games_contra ?? 0;
  const diff = gf - gc;

  // Rellenar meses faltantes en los últimos 12
  const filledMonths = (() => {
    const map = Object.fromEntries((monthlyStats ?? []).map(m => [m.month, m]));
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      const row = map[key];
      result.push({
        month: label,
        partidos:  row?.partidos  ?? 0,
        victorias: row?.victorias ?? 0,
        winRate:   row?.partidos > 0 ? Math.round((row.victorias / row.partidos) * 100) : 0,
      });
    }
    return result;
  })();

  const activeMonths = filledMonths.filter(m => m.partidos > 0).length;
  const avgPerMonth  = activeMonths > 0 ? (stats.partidos / activeMonths).toFixed(1) : '—';

  const bestMonth = (() => {
    const active = (monthlyStats ?? []).filter(m => m.victorias > 0 || m.partidos > 0);
    if (!active.length) return null;
    const best = active.reduce((b, m) =>
      m.victorias > b.victorias || (m.victorias === b.victorias && m.partidos > b.partidos) ? m : b,
      active[0]
    );
    const [y, mo] = best.month.split('-');
    const label = new Date(parseInt(y), parseInt(mo) - 1, 1)
      .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return { ...best, label: label.charAt(0).toUpperCase() + label.slice(1) };
  })();

  return (
    <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Lock size={13} className="text-brand" />
        <span className="font-condensed font-bold text-sm tracking-[3px] text-brand">ESTADÍSTICAS AVANZADAS</span>
      </div>

      {/* Mejor racha + Mejor mes */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className="font-condensed font-black text-[32px] text-white leading-none">{stats.racha_max ?? 0}</div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>MEJOR RACHA</div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>
            {(stats.racha_max ?? 0) === 1 ? 'victoria consecutiva' : 'victorias consecutivas'}
          </div>
          <div className="h-0.5 rounded-full mt-2 bg-brand opacity-35" />
        </div>
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          {bestMonth ? (
            <>
              <div className="font-condensed font-black text-[22px] text-white leading-none">{bestMonth.partidos}PJ · {bestMonth.victorias}V</div>
              <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>MEJOR MES</div>
              <div className="text-[10px] font-mono mt-0.5 truncate" style={{ color: '#555' }}>{bestMonth.label}</div>
            </>
          ) : (
            <>
              <div className="font-condensed font-black text-[32px] text-[#333] leading-none">—</div>
              <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>MEJOR MES</div>
            </>
          )}
          <div className="h-0.5 rounded-full mt-2 opacity-35" style={{ background: '#a84af0' }} />
        </div>
      </div>

      {/* Games GF / GC / DIF */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className="font-condensed font-black text-[28px] text-white leading-none">{gf}</div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>GAMES A FAVOR</div>
          <div className="h-0.5 rounded-full mt-2 bg-green opacity-40" />
        </div>
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className="font-condensed font-black text-[28px] text-white leading-none">{gc}</div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>GAMES EN CONTRA</div>
          <div className="h-0.5 rounded-full mt-2 bg-danger opacity-40" />
        </div>
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className={`font-condensed font-black text-[28px] leading-none ${diff > 0 ? 'text-green' : diff < 0 ? 'text-danger' : 'text-white'}`}>
            {diff > 0 ? '+' : ''}{diff}
          </div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>DIFERENCIA</div>
          <div className="h-0.5 rounded-full mt-2 opacity-40" style={{ background: diff >= 0 ? '#4af07a' : '#f07a4a' }} />
        </div>
      </div>

      {/* Meses activos + Promedio */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className="font-condensed font-black text-[28px] text-white leading-none">{activeMonths}</div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>MESES ACTIVOS</div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>últimos 12 meses</div>
        </div>
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className="font-condensed font-black text-[28px] text-white leading-none">{avgPerMonth}</div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>PROM. PARTIDOS/MES</div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>en meses activos</div>
        </div>
      </div>

      {/* Gráfico de barras — partidos + victorias por mes */}
      <div className="mb-6">
        <div className="text-[10px] font-mono tracking-[2px] text-muted mb-3">PARTIDOS POR MES</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={filledMonths} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} barSize={10} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#444', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff06' }} />
            <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', color: '#555', paddingTop: 4 }} />
            <Bar dataKey="partidos" name="Partidos" fill="#4ab8f0" radius={[3, 3, 0, 0]} />
            <Bar dataKey="victorias" name="Victorias" fill="#4af07a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de líneas — win rate por mes */}
      <div className="mb-6">
        <div className="text-[10px] font-mono tracking-[2px] text-muted mb-3">WIN RATE % POR MES</div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={filledMonths} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#444', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#ffffff15' }} />
            <Line
              type="monotone"
              dataKey="winRate"
              name="Win Rate"
              unit="%"
              stroke="#e8f04a"
              strokeWidth={2}
              dot={{ fill: '#e8f04a', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap de actividad */}
      <ActivityHeatmap dailyActivity={dailyActivity} />
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

  const [isFollowing,      setIsFollowing]      = useState(false);
  const [followBusy,       setFollowBusy]       = useState(false);
  const [followHover,      setFollowHover]       = useState(false);
  const [followersCount,   setFollowersCount]    = useState(0);
  const [followingCount,   setFollowingCount]    = useState(0);
  const [followModal,      setFollowModal]       = useState(null); // 'followers' | 'following' | null
  const [followList,       setFollowList]        = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);

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
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    api.groups.byUsername(username)
      .then((d) => {
        setData(d);
        setEditName(d.owner.name);
        setEditUsername(d.owner.username);
        const existing = Array.isArray(d.owner.social_links) ? d.owner.social_links : [];
        setSocialLinks(ensureTrailingEmpty(existing));
        setAvatarUrl(d.owner.avatar_url ?? null);
        setIsFollowing(d.is_following ?? false);
        setFollowersCount(d.owner.followers_count ?? 0);
        setFollowingCount(d.owner.following_count ?? 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <Loader />;
  if (error)   return <div className="text-danger p-10">{error}</div>;

  const { owner, groups, stats, recent_matches, frequent_partners, monthly_stats } = data;
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

  async function handleFollowToggle() {
    if (followBusy) return;
    setFollowBusy(true);
    try {
      if (isFollowing) {
        await api.follows.unfollow(owner.username);
        setIsFollowing(false);
        setFollowersCount(c => c - 1);
      } else {
        await api.follows.follow(owner.username);
        setIsFollowing(true);
        setFollowersCount(c => c + 1);
      }
    } catch { /* ignore */ }
    finally { setFollowBusy(false); }
  }

  async function openFollowModal(type) {
    setFollowModal(type);
    setFollowList([]);
    setFollowListLoading(true);
    try {
      const list = type === 'followers'
        ? await api.follows.followers(owner.username)
        : await api.follows.following(owner.username);
      setFollowList(list);
    } catch { /* ignore */ }
    finally { setFollowListLoading(false); }
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
                size={130}
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
                @{owner.username} · Padeleando desde {fmt(owner.created_at)}
              </div>
              {isOwnProfile && (
                <div className="mt-1">
                  {user?.subscription?.plan === 'premium' ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-brand border border-brand rounded px-1.5 py-0.5">
                      <BadgeCheck size={11} />
                      PREMIUM
                      {user.subscription.starts_at && (
                        <> · desde {new Date(user.subscription.starts_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</>
                      )}
                      {user.subscription.ends_at && (
                        <> al {new Date(user.subscription.ends_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</>
                      )}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPremiumModal(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted hover:text-brand transition-colors bg-transparent p-0 cursor-pointer group border border-muted rounded px-1.5 py-0.5"
                    >
                      <Badge size={11} className="text-muted group-hover:text-brand transition-colors" />
                      Plan FREE
                    </button>
                  )}
                </div>
              )}
              {/* Seguidores / Seguidos */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => openFollowModal('followers')}
                  className="text-[12px] font-mono hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
                  style={{ color: '#888' }}
                >
                  <span className="text-white font-semibold">{followersCount}</span> seguidores
                </button>
                <span className="text-[#333]">·</span>
                <button
                  onClick={() => openFollowModal('following')}
                  className="text-[12px] font-mono hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
                  style={{ color: '#888' }}
                >
                  <span className="text-white font-semibold">{followingCount}</span> seguidos
                </button>
              </div>
              {avatarError && <div className="text-[11px] text-danger font-mono mt-1">{avatarError}</div>}
              <SocialLinksDisplay links={savedLinks} />
            </div>
          </div>

          {/* Botón Seguir / Siguiendo (solo si no es el propio perfil y está logueado) */}
          {!isOwnProfile && user && (
            <button
              onClick={handleFollowToggle}
              onMouseEnter={() => setFollowHover(true)}
              onMouseLeave={() => setFollowHover(false)}
              disabled={followBusy}
              className={`flex items-center gap-2 px-4 py-2 rounded font-condensed font-bold text-[13px] tracking-widest border transition-colors cursor-pointer disabled:opacity-40 ${
                isFollowing
                  ? followHover
                    ? 'border-danger text-danger bg-transparent'
                    : 'border-border-strong text-muted bg-transparent'
                  : 'bg-brand text-base border-brand hover:brightness-110'
              }`}
            >
              {isFollowing
                ? followHover
                  ? <><UserPlus size={14} /> DEJAR DE SEGUIR</>
                  : <><UserCheck size={14} /> SIGUIENDO</>
                : <><UserPlus size={14} /> SEGUIR</>
              }
            </button>
          )}
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

              {/* Torneos · Partidos · Racha actual — misma fila */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
                  <div className="font-condensed font-black text-[32px] text-white leading-none">{stats.torneos}</div>
                  <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>TORNEOS</div>
                  <div className="h-0.5 rounded-full mt-2" style={{ background: '#4ab8f0', opacity: 0.35 }} />
                </div>
                <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
                  <div className="font-condensed font-black text-[32px] text-white leading-none">{stats.partidos}</div>
                  <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>PARTIDOS</div>
                  <div className="h-0.5 rounded-full mt-2" style={{ background: '#4af07a', opacity: 0.35 }} />
                </div>
                <div className="rounded-lg px-4 py-3 border flex flex-col justify-between"
                  style={{ background: stats.racha > 0 ? '#e8f04a08' : undefined, borderColor: stats.racha > 0 ? '#e8f04a33' : '#1e1e1e' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-condensed font-black text-[32px] leading-none" style={{ color: stats.racha > 0 ? '#e8f04a' : '#333' }}>
                        {stats.racha}
                      </div>
                      <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>RACHA ACTUAL</div>
                    </div>
                    <Flame size={16} style={{ color: stats.racha > 0 ? '#e8f04a' : '#2a2a2a', marginTop: 2 }} />
                  </div>
                </div>
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

        {/* Estadísticas avanzadas — premium: datos reales; free: imagen placeholder con blur */}
        {isOwnProfile && stats?.partidos > 0 && (
          owner.is_premium ? (
            <AdvancedStats stats={stats} monthlyStats={monthly_stats ?? []} dailyActivity={data.daily_activity ?? []} />
          ) : (
            <div className="relative mb-6 rounded-lg overflow-hidden select-none mx-auto border border-border-mid">
              <img
                src={statsPreview}
                alt=""
                aria-hidden="true"
                draggable="false"
                className="w-full rounded-lg"
                style={{ filter: 'blur(5px)', transform: 'scale(1.03)' }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-base/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Gem size={20} className="text-brand" />
                  <span className="font-condensed font-bold text-lg text-white tracking-wide">ESTADÍSTICAS AVANZADAS</span>
                </div>
                <p className="text-sm font-sans text-secondary text-center px-6">
                  Desbloqueá todas las estadísticas con Premium.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPremiumModal(true)}
                  className="flex items-center gap-2 bg-brand text-base border-0 px-5 py-2.5 font-condensed font-bold text-sm tracking-wide cursor-pointer rounded-lg"
                >
                  <Gem size={14} /> VER PLANES
                </button>
              </div>
            </div>
          )
        )}

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
                      </div>
                      <div className="text-[12px] font-mono truncate" style={{ color: '#888' }}>
                        <span className="text-[#444]">vs </span>
                        {firstName(m.opp1_name)} & {firstName(m.opp2_name)}
                      </div>
                      <div className="text-[10px] text-dim font-mono mt-0.5 truncate">{m.tournament_name}</div>
                    </div>
                    {/* Date */}
                    <div className="shrink-0 text-[10px] text-dim font-mono">
                      {m.played_at ? `${m.played_at.slice(8, 10)}/${m.played_at.slice(5, 7)}` : ''}
                    </div>
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

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}

      {followModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-5">
          <div className="bg-surface border border-border-strong rounded-lg w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-mid">
              <span className="font-condensed font-bold text-sm tracking-[3px] text-muted">
                {followModal === 'followers' ? 'SEGUIDORES' : 'SEGUIDOS'}
              </span>
              <button
                onClick={() => setFollowModal(null)}
                className="text-muted hover:text-white transition-colors cursor-pointer bg-transparent border-none"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto px-4 py-3">
              {followListLoading ? (
                <div className="py-8 text-center text-dim text-xs font-mono">Cargando...</div>
              ) : followList.length === 0 ? (
                <div className="py-8 text-center text-dim text-xs font-mono">
                  {followModal === 'followers' ? 'Nadie sigue a este usuario todavía.' : 'Este usuario no sigue a nadie todavía.'}
                </div>
              ) : (
                <div className="flex flex-col">
                  {followList.map(u => (
                    <div
                      key={u.id}
                      onClick={() => { setFollowModal(null); navigate(`/u/${u.username}`); }}
                      className="flex items-center gap-3 py-2.5 border-b border-border-strong last:border-b-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <PlayerAvatar name={u.name} src={u.avatar_url} size={36} premium={u.is_premium} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-white truncate">{u.name}</div>
                        <div className="text-[11px] font-mono text-dim">@{u.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
