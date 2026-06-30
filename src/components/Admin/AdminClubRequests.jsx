import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, Phone, MessageCircle, Check, X, Clock } from 'lucide-react'
import { api } from '../../utils/api'
import { useToast } from '../../context/useToast'
import { scheduleLines } from '../Club/clubForm'
import Loader from '../Loader/Loader'
import PlayerAvatar from '../shared/PlayerAvatar'

const TABS = [
  { key: 'pending',  label: 'PENDIENTES' },
  { key: 'approved', label: 'APROBADAS' },
  { key: 'rejected', label: 'RECHAZADAS' },
]

function RequestCard({ req, onAction, busy }) {
  const d = req.proposed_data ?? {}
  const horarios = scheduleLines(d.schedule)
  const social = (d.social_links ?? []).filter((s) => s.url)
  const isPending = req.status === 'pending'

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={18} className="text-brand shrink-0" />
          <div className="font-condensed font-bold text-lg text-white truncate">{req.name}</div>
        </div>
        {req.status !== 'pending' && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${req.status === 'approved' ? 'text-green border-green/40' : 'text-danger border-danger/40'}`}>
            {req.status === 'approved' ? 'APROBADA' : 'RECHAZADA'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 mt-3 text-sm text-secondary font-sans">
        {d.location_name && <div className="flex items-center gap-2"><MapPin size={13} className="text-muted shrink-0" />{d.location_name}</div>}
        {d.contact_phone && <div className="flex items-center gap-2"><Phone size={13} className="text-muted shrink-0" />{d.contact_phone}</div>}
        {d.contact_whatsapp && <div className="flex items-center gap-2"><MessageCircle size={13} className="text-muted shrink-0" />{d.contact_whatsapp}</div>}
        {d.courts != null && d.courts !== '' && <div className="text-muted text-xs font-mono">{d.courts} canchas</div>}
        {horarios.map((l, i) => <div key={i} className="flex items-center gap-2 text-xs text-muted"><Clock size={12} />{l}</div>)}
        {social.length > 0 && <div className="text-xs text-muted font-mono truncate">{social.map((s) => `${s.platform}: ${s.url}`).join(' · ')}</div>}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <Link to={`/u/${req.requester_username}`} className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
          <PlayerAvatar name={req.requester_name} src={req.requester_avatar_url} size={22} />
          <span className="text-muted text-[11px] font-mono truncate">@{req.requester_username}</span>
        </Link>
        {req.created_club_id && (
          <Link to={`/club/${req.created_club_id}`} className="text-[11px] font-mono text-brand hover:underline">ver club →</Link>
        )}
        {isPending && (
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => onAction(req, 'reject')}
              className="inline-flex items-center gap-1 text-[11px] font-condensed font-bold tracking-widest text-danger border border-danger/40 hover:bg-danger/10 px-2.5 py-1.5 rounded cursor-pointer disabled:opacity-50">
              <X size={12} /> RECHAZAR
            </button>
            <button disabled={busy} onClick={() => onAction(req, 'approve')}
              className="inline-flex items-center gap-1 text-[11px] font-condensed font-bold tracking-widest text-base bg-brand hover:opacity-90 px-2.5 py-1.5 rounded cursor-pointer disabled:opacity-50">
              <Check size={12} /> APROBAR
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminClubRequests() {
  const { showToast } = useToast()
  const [tab, setTab]       = useState('pending')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [busyId, setBusyId] = useState(null)

  const fetchRequests = useCallback(async (status) => {
    setLoading(true)
    try {
      setRequests(await api.clubs.requests.list(status))
      setError(null)
    } catch (e) { setError(e.message) }
    finally     { setLoading(false) }
  }, [])

  useEffect(() => { fetchRequests(tab) }, [tab, fetchRequests])

  async function onAction(req, action) {
    setBusyId(req.id)
    try {
      await api.clubs.requests.respond(req.id, action)
      showToast(action === 'approve' ? 'Club creado a partir de la solicitud' : 'Solicitud rechazada', action === 'approve' ? 'success' : 'info')
      await fetchRequests(tab)
    } catch (e) { setError(e.message) }
    finally     { setBusyId(null) }
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      <Link to="/admin" className="inline-flex items-center gap-1 text-muted hover:text-white text-xs font-mono mb-3 transition-colors">
        <ArrowLeft size={12} /> Dashboard
      </Link>

      <h1 className="font-condensed font-black text-2xl tracking-widest text-white mb-1">
        SOLICITUDES DE CLUB <span className="text-brand">/ ADMIN</span>
      </h1>
      <p className="text-muted text-xs font-mono mb-5">Revisá y aprobá los clubes propuestos por usuarios</p>

      <div className="flex gap-1 mb-5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-[11px] font-condensed font-bold tracking-widest px-3 py-1.5 rounded transition-colors ${tab === t.key ? 'bg-brand text-base' : 'bg-surface border border-border text-muted hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-danger text-xs font-mono mb-3">{error}</p>}

      {loading ? <Loader /> : (
        <div className="flex flex-col gap-3">
          {requests.length === 0 && <p className="text-muted text-xs font-mono py-8 text-center">Sin solicitudes.</p>}
          {requests.map((req) => (
            <RequestCard key={req.id} req={req} onAction={onAction} busy={busyId === req.id} />
          ))}
        </div>
      )}
    </div>
  )
}
