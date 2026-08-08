import { Info } from 'lucide-react'

// Aclaración destacada: se usa para las reglas que sorprenden al usuario
// (permisos, herencia, límites del plan).
export default function Note({ children }) {
  return (
    <div className="flex gap-3 items-start bg-brand/8 border border-brand/20 rounded-lg px-4 py-3 mb-6 mt-2">
      <Info size={15} className="text-brand shrink-0 mt-0.5" />
      <div className="text-[13px] text-content font-sans leading-relaxed">{children}</div>
    </div>
  )
}
