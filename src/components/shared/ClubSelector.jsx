import { useEffect, useRef, useState } from 'react'
import { MapPin, X, Plus, Loader2, Building2 } from 'lucide-react'
import { api } from '../../utils/api'
import ClubRequestModal from '../Club/ClubRequestModal'

// Selector de club (opcional) para asociar a un torneo.
// value: club seleccionado ({ id, name, ... }) | null. onChange(club | null).
export default function ClubSelector({ value, onChange }) {
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]     = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    if (value) return
    const t = setTimeout(() => {
      setLoading(true)
      api.clubs.list(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, query ? 300 : 0)
    return () => clearTimeout(t)
  }, [query, value])

  // Cerrar dropdown al click afuera
  useEffect(() => {
    function onDoc(e) { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 bg-surface border border-brand/50 rounded-sm px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={14} className="text-brand shrink-0" />
          <div className="min-w-0">
            <div className="text-sm text-white truncate">{value.name}</div>
            {value.location_name && (
              <div className="flex items-center gap-1 text-[11px] text-dim font-mono truncate">
                <MapPin size={9} />{value.location_name}
              </div>
            )}
          </div>
        </div>
        <button type="button" onClick={() => onChange(null)}
          className="text-[#555] hover:text-danger transition-colors bg-transparent border-none cursor-pointer shrink-0">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        {loading
          ? <Loader2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555] animate-spin" />
          : <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]" />}
        <input
          className="w-full bg-surface border border-border-mid text-white pl-7 pr-3 py-2.5 rounded-sm text-sm outline-none font-sans"
          placeholder="Buscar club..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-border-mid rounded-sm overflow-hidden max-h-64 overflow-y-auto" style={{ background: '#111827' }}>
          {results.map((c) => (
            <div key={c.id}
              onMouseDown={(e) => { e.preventDefault(); onChange(c); setOpen(false); setQuery('') }}
              className="flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-border-mid last:border-0 hover:bg-surface transition-colors">
              <Building2 size={12} className="text-[#444] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm text-white leading-snug truncate">{c.name}</div>
                {c.location_name && <div className="text-xs text-[#555] mt-0.5 truncate">{c.location_name}</div>}
              </div>
            </div>
          ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2.5 text-xs text-[#555] font-mono">Sin resultados</div>
          )}
          <button type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowRequest(true); setOpen(false) }}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-mono text-brand hover:bg-surface transition-colors cursor-pointer border-t border-border-mid bg-transparent">
            <Plus size={12} /> ¿No está tu club? Solicitalo
          </button>
        </div>
      )}

      {showRequest && (
        <ClubRequestModal
          initialName={query}
          onClose={() => setShowRequest(false)}
        />
      )}
    </div>
  )
}
