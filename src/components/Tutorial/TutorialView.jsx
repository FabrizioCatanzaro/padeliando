import { useState, useEffect } from 'react'
import {
  UserCheck, Plus, Split, CheckCheck, Lock, Pencil, Users, UserCog,
  Mail, Ticket, Bell, LogIn, ChevronDown, UserPlus, ArrowRightLeft,
  BarChart3, Sparkles, Share2, Crown, Image as ImageIcon, Camera, MapPin, Search,
  Timer, Smartphone, ShieldCheck, Heart,
} from 'lucide-react'
import FadeInCard from '../shared/FadeInCard'
import RegistroSection from './sections/RegistroSection'
import CrearCategoriaSection from './sections/CrearCategoriaSection'
import FormatosSection from './sections/FormatosSection'
import FinalizarSection from './sections/FinalizarSection'
import PrivacidadSection from './sections/PrivacidadSection'
import EditarCategoriaSection from './sections/EditarCategoriaSection'
import JugadoresSection from './sections/JugadoresSection'
import PerfilSection from './sections/PerfilSection'
import CrearTorneoSection from './sections/CrearTorneoSection'
import CrearPartidoSection from './sections/CrearPartidoSection'
import InvitarJugadoresSection from './sections/InvitarJugadoresSection'
import InscripcionesSection from './sections/InscripcionesSection'
import SumarteSection from './sections/SumarteSection'
import NotificacionesSection from './sections/NotificacionesSection'
import CoOrganizadoresSection from './sections/CoOrganizadoresSection'
import TransferirSection from './sections/TransferirSection'
import EstadisticasPerfilSection from './sections/EstadisticasPerfilSection'
import EstadisticasAvanzadasSection from './sections/EstadisticasAvanzadasSection'
import CompartirSection from './sections/CompartirSection'
import PremiumSection from './sections/PremiumSection'
import CargarPartidoSection from './sections/CargarPartidoSection'
import HistoriasSection from './sections/HistoriasSection'
import FotosSection from './sections/FotosSection'
import ClubesSection from './sections/ClubesSection'
import EncontrarSection from './sections/EncontrarSection'
import SeguirSection from './sections/SeguirSection'
import InstalarSection from './sections/InstalarSection'
import CuentaSection from './sections/CuentaSection'

// Agrupadas por lo que el usuario quiere hacer, no por el orden en que se
// construyeron. Con más de diez secciones una lista plana deja de servir.
const GROUPS = [
  {
    id: 'empezar',
    label: 'Empezar',
    sections: [
      { id: 'registro',        icon: UserCheck, title: '¿Para qué registrarme?',     component: RegistroSection },
      { id: 'crear-categoria', icon: Plus,      title: 'Crear una categoría',        component: CrearCategoriaSection },
      { id: 'crear-torneo',    icon: Plus,      title: 'Crear un torneo',            component: CrearTorneoSection },
      { id: 'crear-partido',   icon: Plus,      title: 'Crear un partido',           component: CrearPartidoSection },
      { id: 'instalar',        icon: Smartphone, title: 'Instalar la app',           component: InstalarSection },
    ],
  },
  {
    id: 'organizar',
    label: 'Organizar',
    sections: [
      { id: 'formatos',         icon: Split,      title: 'Modo Liga vs Americano',      component: FormatosSection },
      { id: 'jugadores',        icon: Users,      title: 'Jugadores y parejas',         component: JugadoresSection },
      { id: 'invitar',          icon: Mail,       title: 'Invitar y vincular cuentas',  component: InvitarJugadoresSection },
      { id: 'cargar-partido',   icon: Timer,      title: 'Cargar un partido en detalle', component: CargarPartidoSection },
      { id: 'inscripciones',    icon: Ticket,     title: 'Abrir la inscripción',        component: InscripcionesSection },
      { id: 'fotos',            icon: Camera,     title: 'Fotos del torneo',            component: FotosSection },
      { id: 'clubes',           icon: MapPin,     title: 'Clubes',                      component: ClubesSection },
      { id: 'finalizar-torneo', icon: CheckCheck, title: 'Finalizar un torneo',         component: FinalizarSection },
      { id: 'editar',           icon: Pencil,     title: 'Editar nombre y descripción', component: EditarCategoriaSection },
      { id: 'privacidad',       icon: Lock,       title: 'Privacidad de la categoría',  component: PrivacidadSection },
    ],
  },
  {
    id: 'equipo',
    label: 'Organizar en equipo',
    sections: [
      { id: 'co-organizadores', icon: UserPlus,       title: 'Co-organizadores',        component: CoOrganizadoresSection },
      { id: 'transferir',       icon: ArrowRightLeft, title: 'Transferir la categoría', component: TransferirSection },
    ],
  },
  {
    id: 'participar',
    label: 'Participar',
    sections: [
      { id: 'sumarte',        icon: LogIn,  title: 'Sumarte a un torneo',        component: SumarteSection },
      { id: 'notificaciones', icon: Bell,   title: 'Notificaciones',             component: NotificacionesSection },
      { id: 'encontrar',      icon: Search, title: 'Encontrar categorías',       component: EncontrarSection },
      { id: 'seguir',         icon: Heart,  title: 'Seguir jugadores',           component: SeguirSection },
    ],
  },
  {
    id: 'difundir',
    label: 'Compartir',
    sections: [
      { id: 'compartir', icon: Share2, title: 'Compartir un torneo',  component: CompartirSection },
      { id: 'historias', icon: ImageIcon, title: 'Historias para redes',  component: HistoriasSection },
    ],
  },
  {
    id: 'cuenta',
    label: 'Tu cuenta',
    sections: [
      { id: 'perfil',       icon: UserCog,     title: 'Editar datos personales',      component: PerfilSection },
      { id: 'estadisticas', icon: BarChart3,   title: 'Tu perfil y tus estadísticas', component: EstadisticasPerfilSection },
      { id: 'avanzadas',    icon: Sparkles,    title: 'Estadísticas avanzadas',       component: EstadisticasAvanzadasSection },
      { id: 'premium',      icon: Crown,       title: 'Plan Básico y Premium',        component: PremiumSection },
      { id: 'seguridad',    icon: ShieldCheck, title: 'Tu cuenta y tu seguridad',     component: CuentaSection },
    ],
  },
]

const SECTIONS = GROUPS.flatMap((g) => g.sections)

// /tutorial#crear-categoria abre esa sección. Lo usan el checklist de la portada
// y cualquier ayuda contextual que quiera mandar acá sin repetir el texto.
function sectionFromHash() {
  const id = window.location.hash.replace('#', '')
  return SECTIONS.some((s) => s.id === id) ? id : null
}

export default function TutorialView() {
  const [activeId, setActiveId] = useState(() => sectionFromHash() ?? SECTIONS[0].id)
  const [indexOpen, setIndexOpen] = useState(false)

  // Navegar a otro #hash con el tutorial ya abierto no remonta el componente.
  useEffect(() => {
    const onHash = () => { const id = sectionFromHash(); if (id) setActiveId(id) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0]
  const ActiveComponent = active.component
  const ActiveIcon = active.icon

  function select(id) {
    setActiveId(id)
    setIndexOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navButton = (s) => {
    const Icon = s.icon
    const isActive = s.id === activeId
    return (
      <button
        key={s.id}
        onClick={() => select(s.id)}
        className={`w-full flex items-center gap-3 px-5 py-2.5 text-left bg-transparent border-0 text-sm font-sans transition-colors cursor-pointer ${
          isActive
            ? 'text-brand bg-surface border-r-2 border-r-brand'
            : 'text-content hover:text-white hover:bg-surface'
        }`}
      >
        <Icon size={15} className="shrink-0" />
        <span className="leading-snug">{s.title}</span>
      </button>
    )
  }

  const groupLabel = (label) => (
    <div className="text-[10px] font-mono text-muted tracking-widest px-5 pt-4 pb-2 uppercase">
      {label}
    </div>
  )

  return (
    <div className="bg-base text-content font-sans pb-15">
      {/* Cabecera */}
      <div className="px-6 pt-6 pb-5 border-b border-border">
        <div className="font-condensed font-bold text-[28px] text-white tracking-wide">
          Ayuda y tutoriales
        </div>
        <div className="text-[12px] text-muted font-mono mt-1">
          Todo lo que necesitás saber para usar Padeleando
        </div>
      </div>

      {/* Mobile: índice desplegable. Una tira horizontal de 14 tabs ya no se puede recorrer. */}
      <div className="md:hidden border-b border-border">
        <button
          onClick={() => setIndexOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-6 py-3.5 bg-transparent border-0 cursor-pointer"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <ActiveIcon size={15} className="text-brand shrink-0" />
            <span className="font-condensed font-bold text-[15px] text-white tracking-wide truncate">
              {active.title}
            </span>
          </span>
          <ChevronDown
            size={16}
            className={`text-muted shrink-0 transition-transform ${indexOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {indexOpen && (
          <div className="border-t border-border pb-2 max-h-[60vh] overflow-y-auto">
            {GROUPS.map((g) => (
              <div key={g.id}>
                {groupLabel(g.label)}
                {g.sections.map(navButton)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: sidebar agrupado + contenido */}
      <div className="hidden md:flex gap-0">
        <aside className="w-64 shrink-0 border-r border-border sticky top-0 self-start h-screen overflow-y-auto pb-6">
          {GROUPS.map((g) => (
            <div key={g.id}>
              {groupLabel(g.label)}
              {g.sections.map(navButton)}
            </div>
          ))}
        </aside>

        <main className="flex-1 min-w-0 p-8 max-w-3xl">
          <FadeInCard key={activeId}>
            <ActiveComponent />
          </FadeInCard>
        </main>
      </div>

      {/* Mobile: contenido debajo del índice */}
      <div className="md:hidden p-6">
        <FadeInCard key={activeId}>
          <ActiveComponent />
        </FadeInCard>
      </div>
    </div>
  )
}
