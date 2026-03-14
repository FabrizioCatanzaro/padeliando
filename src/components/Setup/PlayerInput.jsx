import { useState, useRef, useEffect } from 'react';
import { normalize } from '../../utils/helpers';
import { api } from '../../utils/api';

// groupId: si se pasa, el autocomplete muestra solo jugadores de ese grupo (evita confusión entre "Pepe" de distintos grupos)
export default function PlayerInput({ value, onChange, placeholder, className, groupId }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!value.trim()) return;
    const t = setTimeout(async () => {
      try {
        const players = await api.players.search(value, groupId);
        setSuggestions(players);
      } catch { setSuggestions([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [value, groupId]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isExisting = suggestions.some((p) => normalize(p.name) === normalize(value));

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
        {value.trim() && (
          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono tracking-wide pointer-events-none ${isExisting ? 'text-green' : 'text-brand'}`}>
            {isExisting ? "✓ EXISTE" : "NUEVO"}
          </span>
        )}
      </div>

      {open && value.trim() && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-100 bg-surface-alt border border-border-strong border-t-0 rounded-b-sm max-h-40 overflow-y-auto">
          {suggestions.map((p) => (
            <div
              key={p.id}
              onMouseDown={() => { onChange(p.name); setOpen(false); }}
              className="px-3.5 py-2.25 cursor-pointer text-[14px] text-content font-sans border-b border-border-mid hover:bg-border-mid"
            >
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
