import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPin, Phone, MessageCircle, Instagram, Facebook, Globe, Building2,
  ChevronLeft, Clock, LayoutGrid, Trophy, Calendar, User, Navigation, Pencil,
} from 'lucide-react'
import { api } from '../../utils/api'
import { useAuth } from '../../context/useAuth'
import { fmt, TOURNAMENT_STATUS_META } from '../../utils/helpers'
import { scheduleLines, whatsappLink, socialUrl, socialLabel } from './clubForm'
import courtBg from '../../assets/padelcourt.png'
import Loader from '../Loader/Loader'
import Badge from '../shared/Badge'
import FadeInCard from '../shared/FadeInCard'
import ClubRequestModal from './ClubRequestModal'
import ClubEditModal from './ClubEditModal'

const SOCIAL_ICON = { instagram: Instagram, facebook: Facebook, website: Globe }

// Mapea el bucket del backend (upcoming/ongoing/past) al meta de estado.
const STATE_KEY = { upcoming: 'upcoming', ongoing: 'active', past: 'finished' }

// Link a la app de mapas según la plataforma (Apple Maps en iOS/Mac, Google Maps en el resto).
// Usa coordenadas si las hay; si no, el nombre de la ubicación.
function mapsUrl(club) {
  const hasCoords = club.lat != null && club.lon != null
  if (!hasCoords && !club.location_name) return null
  const isApple = /iP(hone|ad|od)|Macintosh/.test(navigator.userAgent)
  const label = encodeURIComponent(club.name || 'Club')
  if (isApple) {
    return hasCoords
      ? `https://maps.apple.com/?ll=${club.lat},${club.lon}&q=${label}`
      : `https://maps.apple.com/?q=${encodeURIComponent(club.location_name)}`
  }
  return hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${club.lat},${club.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(club.location_name)}`
}

function EventCard({ ev, state, delay }) {
  const isAmericano = ev.format === 'americano'
  const meta = TOURNAMENT_STATUS_META[STATE_KEY[state] ?? 'active']
  return (
    <Link to={`/cat/${ev.group_id}/torneo/${ev.id}`}>
      <FadeInCard delay={delay}
        className="border border-border-mid rounded-lg cursor-pointer overflow-hidden card-link px-4 py-3.5"
        style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #1c1c1c 100%)' }}>
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="font-condensed font-bold text-lg text-content leading-tight">{ev.name}</div>
          <Badge variant="status" color={meta.color}>{meta.label}</Badge>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-dim font-mono text-sm">
          <span>{isAmericano ? 'AMERICANO' : 'LIGA'}</span>
          {ev.players_count > 0 && (
            <span className="flex items-center gap-1"><User size={11} />{ev.players_count}</span>
          )}
          {ev.group_name && <span className="truncate">· {ev.group_name}</span>}
          <span className="ml-auto flex items-center gap-1">
            <Calendar size={11} />{fmt(ev.event_date ?? ev.created_at)}
          </span>
        </div>
      </FadeInCard>
    </Link>
  )
}

const EVENT_TABS = [
  { key: 'past',     label: 'PASADOS'  },
  { key: 'ongoing',  label: 'EN CURSO' },
  { key: 'upcoming', label: 'PRÓXIMOS' },
]

export default function ClubProfileView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [club, setClub]     = useState(null)
  const [events, setEvents] = useState({ upcoming: [], ongoing: [], past: [] })
  const [activeTab, setActiveTab] = useState('ongoing')
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [showEditRequest, setShowEditRequest] = useState(false)
  const [showEditClub, setShowEditClub] = useState(false)

  function handleEditRequest() {
    if (!isLoggedIn) { navigate('/login'); return }
    setShowEditRequest(true)
  }

  const fetchData = useCallback(async (clubId) => {
    setLoading(true)
    try {
      const [c, e] = await Promise.all([api.clubs.get(clubId), api.clubs.events(clubId)])
      setClub(c); setEvents(e); setError(null)
      // Seleccionar por defecto la primera pestaña con eventos
      setActiveTab(e.ongoing.length ? 'ongoing' : e.upcoming.length ? 'upcoming' : e.past.length ? 'past' : 'ongoing')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(id) }, [id, fetchData])

  if (loading) return <Loader />
  if (error)   return <p className="text-danger text-sm font-mono p-6">{error}</p>
  if (!club)   return null

  const social = (club.social_links ?? []).filter((s) => s.url)
  const horarios = scheduleLines(club.schedule)
  const hasEvents = events.upcoming.length || events.ongoing.length || events.past.length
  const maps = mapsUrl(club)

  return (
    <div className="bg-base text-content font-sans pb-15">
      {/* Header con fondo de cancha genérica + foto del club a la izquierda del nombre */}
      <div className="relative overflow-hidden border-b border-border">
        <img
          src={courtBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          style={{ filter: 'grayscale(25%) brightness(0.8) contrast(0.95)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.6))' }} />

        <div className="absolute top-4 left-4 z-10">
          <button onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 bg-black/50 backdrop-blur text-white text-xs font-mono px-2.5 py-1.5 rounded hover:bg-black/70 transition-colors cursor-pointer border-none">
            <ChevronLeft size={13} /> Volver
          </button>
        </div>

        <div className="relative px-5 sm:px-6 pt-16 pb-5 flex items-end gap-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-surface border border-border-strong overflow-hidden shrink-0 flex items-center justify-center shadow-lg shadow-black/40">
            {club.photo_url
              ? <img src={club.photo_url} alt={club.name} className="w-full h-full object-contain" />
              : <Building2 size={38} className="text-border-strong" />}
          </div>
          <div className="min-w-0 pb-1">
            <h1 className="font-condensed font-black text-[26px] sm:text-[32px] text-white tracking-wide leading-none">{club.name}</h1>
            {club.location_name && (
              maps ? (
                <a
                  href={maps}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1.5 text-secondary hover:text-brand font-mono text-sm mt-2 transition-colors"
                >
                  <MapPin size={13} className="shrink-0" />
                  <span className="underline-offset-2 group-hover:underline">{club.location_name}</span>
                  <Navigation size={12} className="shrink-0 opacity-60 group-hover:opacity-100" />
                </a>
              ) : (
                <div className="flex items-center gap-1.5 text-secondary font-mono text-sm mt-2">
                  <MapPin size={13} className="shrink-0" /><span className="truncate">{club.location_name}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-6 relative">
        {/* Datos */}
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          {(club.contact_phone || club.contact_whatsapp) && (
            <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-2">
              <div className="font-condensed font-bold text-[11px] tracking-[2px] text-muted">CONTACTO</div>
              {club.contact_phone && (
                <a href={`tel:${club.contact_phone}`} className="flex items-center gap-2 text-sm text-white hover:text-brand transition-colors">
                  <Phone size={14} className="text-muted" />{club.contact_phone}
                </a>
              )}
              {club.contact_whatsapp && (
                <a href={whatsappLink(club.contact_whatsapp)} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-white hover:text-brand transition-colors">
                  <MessageCircle size={14} className="text-muted" />{club.contact_whatsapp}
                </a>
              )}
            </div>
          )}

          {club.courts != null && (
            <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-2">
              <div className="font-condensed font-bold text-[11px] tracking-[2px] text-muted">CANCHAS</div>
              <div className="flex items-center gap-2 text-white text-sm">
                <LayoutGrid size={14} className="text-muted" />
                {club.courts} {club.courts === 1 ? 'cancha' : 'canchas'}
              </div>
            </div>
          )}

          {horarios.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-2">
              <div className="font-condensed font-bold text-[11px] tracking-[2px] text-muted">HORARIOS</div>
              {horarios.map((line, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white">
                  <Clock size={14} className="text-muted shrink-0" />{line}
                </div>
              ))}
            </div>
          )}

          {social.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-2">
              <div className="font-condensed font-bold text-[11px] tracking-[2px] text-muted">REDES</div>
              <div className="flex flex-col gap-2">
                {social.map((s) => {
                  const Icon = SOCIAL_ICON[s.platform] ?? Globe
                  return (
                    <a key={s.platform} href={socialUrl(s)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-white hover:text-brand transition-colors min-w-0" title={s.platform}>
                      <Icon size={16} className="text-muted shrink-0" />
                      <span className="truncate">{socialLabel(s)}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Editar (admin) o solicitar cambios (usuarios) */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-dashed border-border-strong px-4 py-3">
          <p className="text-dim text-xs font-mono">
            {isAdmin ? 'Sos admin: podés editar el club directamente.' : '¿Algún dato desactualizado?'}
          </p>
          {isAdmin ? (
            <button
              onClick={() => setShowEditClub(true)}
              className="inline-flex items-center gap-1.5 text-xs font-condensed font-bold tracking-widest text-base bg-brand hover:opacity-90 px-3 py-1.5 rounded transition-opacity cursor-pointer border-none shrink-0"
            >
              <Pencil size={12} /> EDITAR CLUB
            </button>
          ) : (
            <button
              onClick={handleEditRequest}
              className="inline-flex items-center gap-1.5 text-xs font-condensed font-bold tracking-widest text-brand border border-brand/40 hover:bg-brand/10 px-3 py-1.5 rounded transition-colors cursor-pointer bg-transparent shrink-0"
            >
              <Pencil size={12} /> SOLICITAR CAMBIOS
            </button>
          )}
        </div>

        {/* Eventos */}
        <div className="mt-8">
          <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-4 flex items-center gap-2">
            <Trophy size={15} /> EVENTOS
          </div>

          {/* Selector de estado (izq → der) */}
          <div className="flex gap-1.5 mb-5">
            {EVENT_TABS.map((t) => {
              const items = events[t.key] ?? []
              const isActive = activeTab === t.key
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-condensed font-bold tracking-widest px-3 py-2 rounded transition-colors cursor-pointer ${isActive ? 'bg-brand text-base' : 'bg-surface border border-border text-muted hover:text-white'}`}>
                  {t.label}
                  <span className={isActive ? 'text-base/70' : 'text-dim'}>({items.length})</span>
                </button>
              )
            })}
          </div>

          {/* Lista del estado seleccionado */}
          {(events[activeTab] ?? []).length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {events[activeTab].map((ev, i) => (
                <EventCard key={ev.id} ev={ev} state={activeTab} delay={i * 50} />
              ))}
            </div>
          ) : (
            <div className="text-center text-dim py-10 font-sans">
              {hasEvents ? 'No hay eventos en este estado.' : 'Todavía no hay eventos en este club.'}
            </div>
          )}
        </div>
      </div>

      {showEditRequest && (
        <ClubRequestModal
          club={club}
          onClose={() => setShowEditRequest(false)}
        />
      )}

      {showEditClub && (
        <ClubEditModal
          club={club}
          onClose={() => setShowEditClub(false)}
          onSaved={() => fetchData(id)}
        />
      )}
    </div>
  )
}
