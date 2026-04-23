import { useState } from 'react'
import { UserCheck, Plus, Split, CheckCheck, Lock, Pencil, Users, UserCog } from 'lucide-react'
import FadeInCard from '../shared/FadeInCard'
import RegistroSection from './sections/RegistroSection'
import CrearTorneoSection from './sections/CrearTorneoSection'
import FormatosSection from './sections/FormatosSection'
import FinalizarSection from './sections/FinalizarSection'
import PrivacidadSection from './sections/PrivacidadSection'
import EditarTorneoSection from './sections/EditarTorneoSection'
import JugadoresSection from './sections/JugadoresSection'
import PerfilSection from './sections/PerfilSection'
import CrearJornadaSection from './sections/CrearJornadaSection'
import CrearPartidoSection from './sections/CrearPartidoSection'

const SECTIONS = [
  { id: 'registro',          icon: UserCheck,   title: '¿Para qué registrarme?',      component: RegistroSection },
  { id: 'crear-torneo',      icon: Plus,        title: 'Crear un torneo',              component: CrearTorneoSection },
  {id: 'crear-jornada',     icon: Plus,        title: 'Crear una jornada',            component: CrearJornadaSection },
  {id: 'crear-partido',     icon: Plus,        title: 'Crear un partido',            component: CrearPartidoSection },
  { id: 'formatos',          icon: Split,       title: 'Modo Liga vs Americano',       component: FormatosSection },
  { id: 'finalizar-jornada', icon: CheckCheck,  title: 'Finalizar una jornada',        component: FinalizarSection },
  { id: 'privacidad',        icon: Lock,        title: 'Privacidad del torneo',        component: PrivacidadSection },
  { id: 'editar-torneo',     icon: Pencil,      title: 'Editar nombre y descripción',  component: EditarTorneoSection },
  { id: 'jugadores',         icon: Users,       title: 'Jugadores y parejas',          component: JugadoresSection },
  { id: 'perfil',            icon: UserCog,     title: 'Editar datos personales',      component: PerfilSection },
]

export default function TutorialView() {
  const [activeSection, setActiveSection] = useState(0)
  const ActiveComponent = SECTIONS[activeSection].component

  return (
    <div className="bg-base text-content font-sans pb-15">
      {/* Page header */}
      <div className="px-6 pt-6 pb-5 border-b border-border">
        <div className="font-condensed font-bold text-[28px] text-white tracking-wide">
          Ayuda y tutoriales
        </div>
        <div className="text-[12px] text-muted font-mono mt-1">
          Todo lo que necesitás saber para usar Padeleando
        </div>
      </div>

      {/* Mobile: horizontal tab strip */}
      <div className="md:hidden flex border-b border-border px-2 items-center overflow-x-auto">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(i)}
              className={`bg-transparent border-0 px-3 py-3.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer border-b-2 whitespace-nowrap transition-all hover:text-brand flex items-center gap-1.5 ${
                activeSection === i
                  ? 'text-brand border-b-brand'
                  : 'text-muted border-b-transparent'
              }`}
            >
              <Icon size={13} />
              {s.title}
            </button>
          )
        })}
      </div>

      {/* Desktop: sidebar + content */}
      <div className="hidden md:flex gap-0">
        {/* Left sidebar */}
        <aside className="w-64 shrink-0 border-r border-border sticky top-0 self-start h-screen overflow-y-auto py-4">
          <div className="text-[10px] font-mono text-muted tracking-widest px-5 mb-3 uppercase">
            Secciones
          </div>
          {SECTIONS.map((s, i) => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(i)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left bg-transparent border-0 text-sm font-sans transition-colors cursor-pointer ${
                  activeSection === i
                    ? 'text-brand bg-surface border-r-2 border-r-brand'
                    : 'text-content hover:text-white hover:bg-surface'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="leading-snug">{s.title}</span>
              </button>
            )
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-8 max-w-3xl">
          <FadeInCard key={activeSection}>
            <ActiveComponent />
          </FadeInCard>
        </main>
      </div>

      {/* Mobile: content below tabs */}
      <div className="md:hidden p-6">
        <FadeInCard key={activeSection}>
          <ActiveComponent />
        </FadeInCard>
      </div>
    </div>
  )
}
