import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, ArrowLeft, Radio, Trophy, ExternalLink } from 'lucide-react'
import { api } from '../../utils/api'
import Loader from '../Loader/Loader'
import PlayerAvatar from '../shared/PlayerAvatar'

const PAGE_SIZE = 25
const STATUS_FILTERS = [
  { value: 'all',      label: 'Todos' },
  { value: 'live',     label: 'En vivo' },
  { value: 'active',   label: 'Activos' },
  { value: 'finished', label: 'Finalizados' },
]

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function FormatBadge({ format, mode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-base border border-border-strong px-1.5 py-0.5 rounded text-muted">
      {format === 'americano' ? 'AMERICANO' : 'LIGA'} · {mode === 'pairs' ? 'parejas' : 'libre'}
    </span>
  )
}

function StatusBadge({ status, hasLive }) {
  if (hasLive) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-danger/15 text-danger border border-danger/40 px-1.5 py-0.5 rounded animate-pulse">
        <Radio size={10} /> EN VIVO
      </span>
    )
  }
  if (status === 'finished') {
    return <span className="text-[10px] font-mono text-muted">finalizado</span>
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-brand/15 text-brand border border-brand/40 px-1.5 py-0.5 rounded">
      <Trophy size={10} /> ACTIVO
    </span>
  )
}

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)
  const [q,           setQ]           = useState('')
  const [status,      setStatus]      = useState('all')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const fetchData = useCallback(async (opts) => {
    setLoading(true)
    try {
      const data = await api.admin.tournaments(opts)
      setTournaments(data.tournaments)
      setTotal(data.total)
      setError(null)
    } catch (e) { setError(e.message) }
    finally     { setLoading(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      fetchData({ q, status, page: 1, limit: PAGE_SIZE })
    }, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [q, status, fetchData])

  function changePage(next) {
    setPage(next)
    fetchData({ q, status, page: next, limit: PAGE_SIZE })
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      <Link to="/admin"
        className="inline-flex items-center gap-1 text-muted hover:text-white text-xs font-mono mb-3 transition-colors">
        <ArrowLeft size={12} /> Dashboard
      </Link>

      <h1 className="font-condensed font-black text-2xl tracking-widest text-white mb-1">
        TORNEOS <span className="text-brand">/ ADMIN</span>
      </h1>
      <p className="text-muted text-xs font-mono mb-6">{total} {total === 1 ? 'torneo' : 'torneos'}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatus(f.value)}
            className={`text-[11px] font-condensed font-bold tracking-widest px-3 py-1.5 rounded transition-colors ${
              status === f.value
                ? 'bg-brand text-base'
                : 'bg-surface border border-border text-muted hover:text-white'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por torneo, grupo o owner"
          className="w-full bg-surface border border-border focus:border-brand outline-none text-white text-sm font-mono pl-9 pr-3 py-2 rounded transition-colors"
        />
      </div>

      {error && <p className="text-danger text-xs font-mono mb-3">{error}</p>}

      {loading ? <Loader /> : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-border-mid/30 text-muted font-condensed text-[11px] tracking-[2px] uppercase">
                <tr>
                  <th className="py-2 px-3">Torneo</th>
                  <th className="py-2 px-3 hidden md:table-cell">Owner</th>
                  <th className="py-2 px-3 hidden sm:table-cell">Formato</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3 hidden sm:table-cell text-center">J</th>
                  <th className="py-2 px-3 hidden sm:table-cell text-center">P</th>
                  <th className="py-2 px-3 hidden lg:table-cell">Creado</th>
                  <th className="py-2 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {tournaments.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-muted text-xs font-mono">Sin resultados</td></tr>
                )}
                {tournaments.map(t => (
                  <tr key={t.id} className="border-t border-border hover:bg-border-mid/20">
                    <td className="py-2 px-3">
                      <div className="text-white font-semibold truncate max-w-[200px]">{t.name}</div>
                      <Link to={`/groups/${t.group_id}`} className="text-muted text-[11px] font-mono truncate hover:text-brand">
                        {t.group_name}
                      </Link>
                    </td>
                    <td className="py-2 px-3 hidden md:table-cell">
                      {t.owner_id ? (
                        <Link to={`/u/${t.owner_username}`} className="flex items-center gap-2 min-w-0 hover:text-brand">
                          <PlayerAvatar name={t.owner_name} src={t.owner_avatar_url} size={22} />
                          <span className="text-white text-xs truncate">@{t.owner_username}</span>
                        </Link>
                      ) : <span className="text-muted text-xs font-mono">—</span>}
                    </td>
                    <td className="py-2 px-3 hidden sm:table-cell">
                      <FormatBadge format={t.format} mode={t.mode} />
                    </td>
                    <td className="py-2 px-3">
                      <StatusBadge status={t.status} hasLive={t.has_live} />
                    </td>
                    <td className="py-2 px-3 hidden sm:table-cell text-center font-mono text-muted text-xs">{t.players_count}</td>
                    <td className="py-2 px-3 hidden sm:table-cell text-center font-mono text-muted text-xs">{t.matches_count}</td>
                    <td className="py-2 px-3 hidden lg:table-cell text-muted font-mono text-xs">{fmtDate(t.created_at)}</td>
                    <td className="py-2 px-3 text-right">
                      <Link
                        to={`/groups/${t.group_id}/tournament/${t.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-condensed font-bold tracking-widest text-brand hover:bg-brand/10 px-2 py-1 rounded"
                      >
                        VER <ExternalLink size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs font-mono text-muted">
              <span>Página {page} de {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => changePage(page - 1)} disabled={page <= 1}
                  className="p-1 hover:text-white disabled:opacity-30">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => changePage(page + 1)} disabled={page >= totalPages}
                  className="p-1 hover:text-white disabled:opacity-30">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
