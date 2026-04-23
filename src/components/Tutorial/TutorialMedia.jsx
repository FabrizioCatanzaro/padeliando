import { Camera } from 'lucide-react'

export default function TutorialMedia({ src, caption, aspect = 'aspect-video' }) {
  return (
    <div className="mb-6">
      {src ? (
        <img
          src={src}
          alt={caption}
          className={`w-full rounded-lg border border-border-strong object-cover ${aspect}`}
        />
      ) : (
        <div
          className={`w-full rounded-lg border border-border-strong bg-surface flex flex-col items-center justify-center gap-3 text-muted ${aspect}`}
        >
          <Camera size={28} className="opacity-40" />
          <span className="text-[12px] font-mono tracking-widest opacity-50">
            IMAGEN PRÓXIMAMENTE
          </span>
        </div>
      )}
      {caption && (
        <div className="text-[11px] font-mono text-muted mt-2 text-center tracking-wide">
          {caption}
        </div>
      )}
    </div>
  )
}
