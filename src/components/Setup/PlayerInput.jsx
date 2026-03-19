import { useState, useRef, useEffect } from 'react';
import { normalize } from '../../utils/helpers';
import { api } from '../../utils/api';

// groupId: filtra solo jugadores de ese grupo específico.
// searchMine: filtra jugadores de todos los grupos del usuario autenticado (para Setup).
export default function PlayerInput({ value, onChange, placeholder, className, groupId, searchMine }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const ref = useRef();

  const isAt = value.startsWith('@');

  useEffect(() => {
    if (!value.trim()) {
      const t = setTimeout(() => setSuggestions([]), 0);
      return () => clearTimeout(t);
    }

    const t = setTimeout(async () => {
      try {
        if (isAt) {
          const q = value.slice(1);
          if (!q) { setSuggestions([]); return; }
          const users = await api.auth.search(q);
          setSuggestions(users);
        } else {
          const players = await api.players.search(value, groupId, searchMine);
          setSuggestions(players);
        }
      } catch { setSuggestions([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [value, groupId, searchMine, isAt]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const matchedUser  = isAt ? suggestions.find((u) => ('@' + u.username) === value.toLowerCase()) : null;
  const isExisting   = !isAt && suggestions.some((p) => normalize(p.name) === normalize(value));

  const badge = (() => {
    if (!value.trim()) return null;
    if (isAt) {
      if (!value.slice(1)) return null;
      return matchedUser
        ? { text: '✓ @USUARIO', color: 'text-green' }
        : null;
    }
    return { text: isExisting ? '✓ EXISTE' : 'NUEVO', color: isExisting ? 'text-green' : 'text-brand' };
  })();

  return (
    <div ref={ref} className={`relative flex-1 ${className ?? ''}`}>
      <div className="relative">
        <input
          className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 font-sans text-[14px] rounded-sm outline-none pr-22.5"
          placeholder={placeholder}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {badge && (
          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono tracking-wide pointer-events-none ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>

      {open && value.trim() && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-100 bg-surface-alt border border-border-strong border-t-0 rounded-b-sm max-h-40 overflow-y-auto">
          {isAt ? (
            suggestions.map((u) => (
              <div
                key={u.id}
                onMouseDown={() => { onChange('@' + u.username); setOpen(false); }}
                className="px-3.5 py-2.25 cursor-pointer text-[14px] text-content font-sans border-b border-border-mid hover:bg-border-mid flex justify-between items-center gap-3"
              >
                <span>{u.name}</span>
                <span className="text-[11px] text-muted font-mono shrink-0">@{u.username}</span>
              </div>
            ))
          ) : (
            suggestions.map((p) => (
              <div
                key={p.id}
                onMouseDown={() => { onChange(p.name); setOpen(false); }}
                className="px-3.5 py-2.25 cursor-pointer text-[14px] text-content font-sans border-b border-border-mid hover:bg-border-mid"
              >
                {p.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
