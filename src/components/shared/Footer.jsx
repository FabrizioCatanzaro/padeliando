import { useState } from 'react'
import { Phone, UserRoundSearch, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoTxtUrl from '../../assets/padeleando-txt.webp'
import ShareAppModal from './ShareAppModal'

const legalLinks = [
  { to: '/sobre-nosotros', label: 'Sobre nosotros' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/terminos', label: 'Términos' },
  { to: '/privacidad', label: 'Privacidad' },
]

export default function Footer() {
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <footer className="border-t border-border bg-base px-6 py-6 flex flex-col items-center gap-4 mt-6">
      <div className="w-full flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex flex-row gap-2 items-center font-condensed font-black text-lg tracking-widest text-gray-700">
          <img src={logoTxtUrl} alt="Padeleando" width="193" height="40" className="max-h-10 grayscale" />
        </div>
        <div className="flex flex-row flex-wrap justify-center items-center gap-5 sm:justify-end">
          <span className="text-xs text-muted font-mono">
            {new Date().getFullYear()} © Desarrollado por Fabrizio Catanzaro
          </span>
          <span className="text-[11px] text-dim font-mono">v{import.meta.env.VITE_APP_VERSION}</span>
        </div>
      </div>

      <div className="flex flex-row flex-wrap justify-center gap-x-5 gap-y-1 pt-1 border-t border-border w-full">
        {legalLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="text-[11px] font-mono text-muted hover:text-gray-400 transition-colors"
          >
            {label}
          </Link>
        ))}
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-1.5 text-[11px] font-mono text-brand hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0"
        >
          <UserPlus size={12} className="shrink-0" />
          Invitar amigos
        </button>
      </div>

      {shareOpen && <ShareAppModal onClose={() => setShareOpen(false)} />}
    </footer>
  )
}
