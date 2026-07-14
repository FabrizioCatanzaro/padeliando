import { Share2 } from 'lucide-react';

// Botón consistente para abrir la exportación de historia.
// variant: "full" (ancho, con texto) | "compact" (píldora chica).
export default function ShareStoryButton({ onClick, variant = 'compact', label = 'Compartir historia', className = '' }) {
  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center justify-center gap-2 bg-transparent border border-brand/50 text-brand px-4 py-2.5 font-condensed font-bold text-[13px] tracking-widest cursor-pointer rounded-lg hover:bg-brand/10 transition-colors ${className}`}
      >
        <Share2 size={14} /> {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1.5 bg-transparent border border-border-strong text-muted px-3 py-2 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm hover:text-brand hover:border-brand/50 transition-colors ${className}`}
    >
      <Share2 size={13} /> HISTORIA
    </button>
  );
}
