import { useEffect, useState } from 'react';
import { Check, Copy, Image as ImageIcon, MoreHorizontal, X } from 'lucide-react';
import { Tile, WhatsAppIcon } from './ShareModal';

/**
 * Comparte un perfil: link por WhatsApp, imagen 9:16, copiar o menú del sistema.
 * Mismo diseño que ShareModal — sirve para el perfil propio y para uno ajeno.
 * `onCreateImage` es opcional: sin partidos ni torneos no hay nada que retratar.
 */
export default function ShareProfileModal({ name, username, url, isOwnProfile = false, onCreateImage, onClose }) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const intro = isOwnProfile ? 'Mirá mis estadísticas de padel en' : `Mirá el perfil de *${name}* en`;
  // WhatsApp interpreta *texto* como negrita
  const waText    = `${intro} *Padeleando*\n@${username}\n\n🔗 ${url}`;
  const plainText = `${isOwnProfile ? 'Mirá mis estadísticas de padel en' : `Mirá el perfil de ${name} en`} Padeleando\n@${username}\n\n🔗 ${url}`;

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
      try { await navigator.share({ title: name, text: plainText, url }); } catch { /* usuario canceló */ }
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
          <span className="font-condensed font-bold text-xl text-white">
            {isOwnProfile ? 'Compartir mi perfil' : 'Compartir perfil'}
          </span>
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
          {onCreateImage && (
            <Tile onClick={onCreateImage} icon={<ImageIcon size={22} />} label="Crear imagen" />
          )}
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
              {isOwnProfile
                ? <>Mirá mis estadísticas de padel en <strong className="text-white font-semibold">Padeleando</strong></>
                : <>Mirá el perfil de <strong className="text-white font-semibold">{name}</strong> en Padeleando</>}
            </p>
            <p className="text-[13px] text-content leading-relaxed font-sans">@{username}</p>
            <p className="text-[12px] text-brand font-mono break-all mt-2">🔗 {url}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
