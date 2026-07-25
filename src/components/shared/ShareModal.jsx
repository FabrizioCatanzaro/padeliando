import { useEffect, useState } from 'react';
import { Check, Copy, MoreHorizontal, X } from 'lucide-react';

// Ícono de marca de WhatsApp (lucide no lo trae)
function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function Tile({ onClick, icon, label, accent = false }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-2 bg-transparent border-0 cursor-pointer group"
    >
      <span
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
          accent
            ? 'bg-[#25D366] text-white'
            : 'bg-surface-alt border border-border-strong text-content group-hover:border-brand group-hover:text-brand'
        }`}
      >
        {icon}
      </span>
      <span className="text-[11px] font-mono text-muted group-hover:text-soft transition-colors text-center leading-tight">
        {label}
      </span>
    </button>
  );
}

export default function ShareModal({ tournamentName, categoryName, clubName, url, onClose }) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const place = clubName || '---';
  // WhatsApp interpreta *texto* como negrita
  const waText    = `¡Sumate a ver *${tournamentName}* - ${categoryName}!\nLugar: ${place}\n\n🔗 ${url}`;
  // Texto plano para el share nativo (sin marcadores de negrita)
  const plainText = `¡Sumate a ver ${tournamentName} - ${categoryName}!\nLugar: ${place}\n\n🔗 ${url}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank', 'noopener');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const moreOptions = async () => {
    if (canNativeShare) {
      try { await navigator.share({ title: tournamentName, text: plainText }); } catch { /* usuario canceló */ }
    } else {
      copyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-1000 bg-black/75 flex items-end sm:items-center justify-center sm:p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-up bg-surface border border-border-strong w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 pt-4 pb-3 border-b border-border-mid">
          {/* Handle (mobile) */}
          <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-2 w-9 h-1 rounded-full bg-border-strong" />
          <span className="font-condensed font-bold text-xl text-white">Compartir torneo</span>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-muted hover:text-white cursor-pointer p-1 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Acciones */}
        <div className="flex items-start gap-2 px-5 pt-5 pb-4">
          <Tile onClick={shareWhatsApp} accent icon={<WhatsAppIcon size={24} />} label="WhatsApp" />
          <Tile
            onClick={copyLink}
            icon={copied ? <Check size={22} /> : <Copy size={22} />}
            label={copied ? 'Copiado' : 'Copiar link'}
          />
          <Tile onClick={moreOptions} icon={<MoreHorizontal size={22} />} label="Más opciones" />
        </div>

        {/* Vista previa del mensaje */}
        <div className="px-5 pb-5">
          <div className="text-[10px] font-mono tracking-widest text-muted mb-2">VISTA PREVIA</div>
          <div className="bg-surface-alt border border-border-mid rounded-xl px-4 py-3">
            <p className="text-[13px] text-content leading-relaxed font-sans">
              ¡Sumate a ver <strong className="text-white font-semibold">{tournamentName}</strong> - {categoryName}!
            </p>
            <p className="text-[13px] text-content leading-relaxed font-sans">Lugar: {place}</p>
            <p className="text-[12px] text-brand font-mono break-all mt-2">🔗 {url}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
