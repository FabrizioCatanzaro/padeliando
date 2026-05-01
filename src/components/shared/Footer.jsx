import { Phone, UserRoundSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoTxtUrl from '../../assets/padeleando-txt.png'

const legalLinks = [
  { to: '/sobre-nosotros', label: 'Sobre nosotros' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/terminos', label: 'Términos' },
  { to: '/privacidad', label: 'Privacidad' },
]

export default function Footer() {

  return (
    <footer className="border-t border-border bg-base px-6 py-6 flex flex-col items-center gap-4 mt-6">
      <div className="w-full flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex flex-row gap-2 items-center font-condensed font-black text-lg tracking-widest text-gray-700">
          <img src={logoTxtUrl} alt="Padeleando" className="max-h-10 grayscale" />
        </div>
        <div className="flex flex-row flex-wrap justify-center items-center gap-5 sm:justify-end">
          <span className="text-xs text-muted font-mono">
            {new Date().getFullYear()} © Desarrollado por Fabrizio Catanzaro
          </span>
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
      </div>
    </footer>
  )
}
