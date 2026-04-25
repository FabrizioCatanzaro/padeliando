import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserCheck, Crown, Layers, Trophy, Swords, UserPlus, Image, ArrowRight } from 'lucide-react'
import { api } from '../../utils/api'
import Loader from '../Loader/Loader'
import TimeseriesChart from './TimeseriesChart'

const RANGE_OPTIONS = [
  { days: 7,  label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
]

function StatCard({ icon, label, value, sub }) {
  const Icon = icon
  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={14} />
        <span className="font-condensed font-bold text-[11px] tracking-[2px] uppercase">{label}</span>
      </div>
      <div className="font-mono text-[28px] text-white font-bold leading-none">{value ?? '—'}</div>
      {sub && <div className="text-[11px] font-mono text-muted">{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null)
  const [series,   setSeries]   = useState(null)
  const [days,     setDays]     = useState(30)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    Promise.all([api.admin.stats(), api.admin.timeseries(days)])
      .then(([s, ts]) => { setStats(s); setSeries(ts.points) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <Loader />
  if (error)   return <p className="text-danger text-sm font-mono p-6">{error}</p>
  if (!stats)  return null

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <h1 className="font-condensed font-black text-2xl tracking-widest text-white mb-1">
        DASHBOARD <span className="text-brand">ADMIN</span>
      </h1>
      <p className="text-muted text-xs font-mono mb-6">Métricas agregadas de la plataforma</p>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/admin/users"
          className="inline-flex items-center gap-2 bg-surface border border-border hover:border-brand text-white text-xs font-condensed font-bold tracking-widest px-4 py-2 rounded transition-colors">
          GESTIONAR USUARIOS <ArrowRight size={12} />
        </Link>
        <Link to="/admin/tournaments"
          className="inline-flex items-center gap-2 bg-surface border border-border hover:border-brand text-white text-xs font-condensed font-bold tracking-widest px-4 py-2 rounded transition-colors">
          VER TORNEOS <ArrowRight size={12} />
        </Link>
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="font-condensed font-bold text-[12px] tracking-[3px] text-muted">ACTIVIDAD</div>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map(opt => (
              <button key={opt.days} onClick={() => setDays(opt.days)}
                className={`text-[11px] font-condensed font-bold tracking-widest px-2 py-1 rounded transition-colors ${
                  days === opt.days
                    ? 'bg-brand text-base'
                    : 'bg-surface border border-border text-muted hover:text-white'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {series && <TimeseriesChart points={series} />}
      </section>

      <section className="mb-8">
        <div className="font-condensed font-bold text-[12px] tracking-[3px] text-muted mb-3">USUARIOS</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Users}     label="Totales"    value={stats.total_users}    sub={`+${stats.new_users_30d} en 30d`} />
          <StatCard icon={UserCheck} label="Verificados" value={stats.verified_users} />
          <StatCard icon={UserPlus}  label="Nuevos 7d"   value={stats.new_users_7d} />
          <StatCard icon={Crown}     label="Premium"     value={stats.premium_users} />
        </div>
      </section>

      <section className="mb-8">
        <div className="font-condensed font-bold text-[12px] tracking-[3px] text-muted mb-3">TORNEOS Y CATEGORÍAS</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Layers} label="Grupos"           value={stats.total_groups}      sub={`+${stats.groups_30d} en 30d`} />
          <StatCard icon={Trophy} label="Torneos totales"  value={stats.total_tournaments} sub={`+${stats.tournaments_30d} en 30d`} />
          <StatCard icon={Trophy} label="Torneos activos"  value={stats.active_tournaments} />
          <StatCard icon={Trophy} label="Torneos 7d"       value={stats.tournaments_7d} />
        </div>
      </section>

      <section className="mb-8">
        <div className="font-condensed font-bold text-[12px] tracking-[3px] text-muted mb-3">PARTIDOS</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Swords} label="Totales"  value={stats.total_matches} sub={`+${stats.matches_30d} en 30d`} />
          <StatCard icon={Swords} label="Últ. 7d"  value={stats.matches_7d} />
          <StatCard icon={Users}  label="Jugadores" value={stats.total_players} />
          <StatCard icon={Image}  label="Fotos"    value={stats.total_photos} />
        </div>
      </section>
    </div>
  )
}
