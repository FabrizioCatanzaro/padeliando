import { useEffect, useState } from 'react';
import { Check, Copy, MoreHorizontal, X } from 'lucide-react';
import { buildFixtureText } from '../../utils/helpers';
import { Tile, WhatsAppIcon } from './ShareModal';

/**
 * Comparte los partidos de un torneo como texto (fixture).
 * Mismo diseño que ShareModal, pero copia/comparte texto en vez de un link.
 */
// Renderiza el texto de WhatsApp (*negrita*) como JSX, para que la vista previa
// se vea igual que el mensaje enviado.
function renderBold(text) {
  return text.split(/(\*[^*\n]+\*)/g).map((chunk, i) =>
    chunk.startsWith('*') && chunk.endsWith('*') && chunk.length > 2
      ? <strong key={i} className="text-white font-semibold">{chunk.slice(1, -1)}</strong>
      : <span key={i}>{chunk}</span>
  );
}

export default function ShareFixtureModal({ tournament, matches, categoryName, onClose }) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // WhatsApp interpreta *texto* como negrita
  const waText    = buildFixtureText(tournament, matches, { bold: true, categoryName });
  const plainText = buildFixtureText(tournament, matches, { categoryName });

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank', 'noopener');
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const moreOptions = async () => {
    if (canNativeShare) {
      try { await navigator.share({ title: tournament.name, text: plainText }); } catch { /* usuario canceló */ }
    } else {
      copyText();
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
          <span className="font-condensed font-bold text-xl text-white">Compartir partidos</span>
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
            onClick={copyText}
            icon={copied ? <Check size={22} /> : <Copy size={22} />}
            label={copied ? 'Copiado' : 'Copiar texto'}
          />
          <Tile onClick={moreOptions} icon={<MoreHorizontal size={22} />} label="Más opciones" />
        </div>

        {/* Vista previa del mensaje */}
        <div className="px-5 pb-5">
          <div className="text-[10px] font-mono tracking-widest text-muted mb-2">VISTA PREVIA</div>
          <div className="bg-surface-alt border border-border-mid rounded-xl px-4 py-3 max-h-64 overflow-y-auto">
            <pre className="text-[12px] text-content leading-relaxed font-sans whitespace-pre-wrap break-words m-0">
              {renderBold(waText)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
