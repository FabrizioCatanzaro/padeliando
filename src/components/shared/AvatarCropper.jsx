import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut } from 'lucide-react';

const OUTPUT_SIZE = 512;
const OUTPUT_MIME = 'image/jpeg';
const OUTPUT_QUALITY = 0.9;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function cropToBlob(src, pixelCrop) {
  const img    = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width  = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen')),
      OUTPUT_MIME,
      OUTPUT_QUALITY
    );
  });
}

export default function AvatarCropper({ file, onCancel, onSave }) {
  const [src,       setSrc]       = useState(null);
  const [crop,      setCrop]      = useState({ x: 0, y: 0 });
  const [zoom,      setZoom]      = useState(1);
  const [pixels,    setPixels]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_area, areaPixels) => {
    setPixels(areaPixels);
  }, []);

  async function handleSave() {
    if (!pixels || !src) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await cropToBlob(src, pixels);
      await onSave(blob);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-1000 p-4">
      <div className="bg-surface border border-border-strong rounded-[10px] w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-5 pt-4 pb-2">
          <div className="font-condensed font-bold text-xl text-white">Ajustar foto de perfil</div>
          <div className="text-[11px] text-dim font-mono mt-0.5">Arrastrá para reposicionar · usá el zoom</div>
        </div>

        <div className="relative bg-black" style={{ height: 340 }}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              minZoom={1}
              maxZoom={4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="px-5 py-3 flex items-center gap-3 border-t border-border-mid">
          <ZoomOut size={14} className="text-dim shrink-0" />
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-brand"
          />
          <ZoomIn size={14} className="text-dim shrink-0" />
        </div>

        {error && (
          <div className="px-5 text-xs text-danger font-mono mb-2">{error}</div>
        )}

        <div className="flex gap-2.5 justify-end px-5 pb-5 pt-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="bg-transparent text-muted border border-border-strong px-5 py-2.5 text-sm cursor-pointer rounded font-sans disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !pixels}
            className="border-0 px-5 py-2.5 font-condensed font-bold text-sm tracking-wide cursor-pointer rounded whitespace-nowrap text-base bg-brand disabled:opacity-50 disabled:cursor-wait"
          >
            {saving ? 'GUARDANDO...' : 'GUARDAR'}
          </button>
        </div>
      </div>
    </div>
  );
}
