import { useCallback, useState } from 'react';
import * as htmlToImage from 'html-to-image';

// Genera un PNG 1080x1920 (9:16, historia de Instagram) a partir de un nodo del DOM
// y lo entrega vía la hoja de compartir del SO (navigator.share con archivos) o,
// si no está disponible, forzando la descarga del archivo.
export function useSnapshot() {
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState(null);
  const [done,  setDone]  = useState(false);

  const share = useCallback(async (node, filename = 'padeleando.png') => {
    if (!node) return;
    setBusy(true); setError(null); setDone(false);
    try {
      // Esperar a que las webfonts estén listas para no capturar texto sin fuente.
      if (document.fonts?.ready) {
        try { await document.fonts.ready; } catch { /* ignore */ }
      }

      const blob = await htmlToImage.toBlob(node, {
        width: 1080,
        height: 1920,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: '#000000',
      });
      if (!blob) throw new Error('No se pudo generar la imagen');

      const file = new File([blob], filename, { type: 'image/png' });

      // 1) Compartir nativo con archivo (móvil → Instagram Stories, etc.)
      const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

      if (canShareFiles) {
        try {
          await navigator.share({ files: [file], title: 'Padeleando' });
          setDone(true);
          return;
        } catch (err) {
          if (err?.name === 'AbortError') return; // el usuario canceló
          // cualquier otro error → caemos a la descarga
        }
      }

      // 2) Fallback: descarga del PNG
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setDone(true);
    } catch (err) {
      setError(err?.message ?? 'Error al generar la imagen');
    } finally {
      setBusy(false);
    }
  }, []);

  return { share, busy, error, done };
}
