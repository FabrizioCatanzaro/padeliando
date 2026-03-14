import { Phone, UserRoundSearch } from 'lucide-react'

export default function Footer() {
  const linkedinUrl = 'https://www.linkedin.com/in/luciano-fabrizio-catanzaro-pfahler/'
  const numeroCelular = '+5491125031107'

  return (
    <footer className="border-t border-border bg-base px-6 py-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-center">
      <div className="flex flex-row gap-2 items-center font-condensed font-black text-lg tracking-widest text-gray-700">
        <span>PADEL<span className="text-brand">EANDO</span></span>
      </div>
      <div className="flex flex-row flex-wrap justify-center items-center gap-5 sm:justify-end">
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
          className="text-muted hover:text-gray-400 transition-colors">
          <UserRoundSearch size={16} />
        </a>
        <a href={`tel:${numeroCelular}`}
          className="text-muted hover:text-gray-400 transition-colors">
          <Phone size={16} />
        </a>
        <a href="mailto:fabricando.dev@gmail.com"
          className="text-xs text-muted font-mono decoration-thickness hover:text-gray-400"
        >
          fabricando.dev@gmail.com
        </a>
        <span className="text-xs text-muted font-mono">
          {new Date().getFullYear()} © Desarrollado por Fabrizio Catanzaro
        </span>
      </div>
    </footer>
  )
}
