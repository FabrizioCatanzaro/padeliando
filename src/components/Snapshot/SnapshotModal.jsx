import { useRef } from 'react';
import { X, Share2, Download, Check } from 'lucide-react';
import { useSnapshot } from './useSnapshot';
import { STORY_W, STORY_H } from './story-theme';

// Ancho del preview en pantalla (el nodo real se captura a 1080x1920).
const PREVIEW_W = 300;
const SCALE     = PREVIEW_W / STORY_W;

// Modal genérico de exportación: muestra `story` (un elemento React que renderiza
// un StoryFrame) escalado como preview y permite compartir/descargar el PNG.
export default function SnapshotModal({ story, filename = 'padeleando.png', onClose }) {
  const captureRef = useRef(null);
  const { share, busy, error, done } = useSnapshot();

  const supportsShare =
    typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-5"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose?.(); }}
    >
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-sm p-5 relative flex flex-col items-center">
        <button
          onClick={() => !busy && onClose?.()}
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer disabled:opacity-40"
          disabled={busy}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="font-condensed font-bold text-lg text-white tracking-wide self-start mb-1">
          Compartir historia
        </div>
        <div className="text-xs font-mono text-muted self-start mb-4">
          Formato 9:16 · listo para Instagram
        </div>

        {/* Preview (escalado). El nodo interno se captura a tamaño real. */}
        <div
          style={{
            width: PREVIEW_W,
            height: PREVIEW_W * (STORY_H / STORY_W),
            overflow: 'hidden',
            borderRadius: 14,
            border: '1px solid #2e2e2e',
            flexShrink: 0,
          }}
        >
          <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: STORY_W, height: STORY_H }}>
            <div ref={captureRef} style={{ width: STORY_W, height: STORY_H }}>
              {story}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-danger text-xs font-mono mt-3 text-center">{error}</div>
        )}

        <button
          onClick={() => share(captureRef.current, filename)}
          disabled={busy}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-brand text-base border-0 py-3 font-condensed font-bold text-[15px] tracking-widest rounded-lg cursor-pointer hover:brightness-110 transition disabled:opacity-50 disabled:cursor-wait"
        >
          {busy
            ? 'GENERANDO...'
            : done
              ? <><Check size={16} /> LISTO</>
              : supportsShare
                ? <><Share2 size={16} /> COMPARTIR</>
                : <><Download size={16} /> DESCARGAR</>}
        </button>
        <div className="text-[11px] font-mono text-dim mt-2 text-center">
          {supportsShare
            ? 'Se abrirá el menú de compartir de tu dispositivo.'
            : 'Se descargará la imagen para subirla a tu historia.'}
        </div>
      </div>
    </div>
  );
}
