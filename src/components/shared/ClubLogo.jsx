import { MapPin } from 'lucide-react';

// Cloudinary redimensiona por URL: el original de un club pesa cientos de KB.
function cdnUrl(src, width) {
  if (!src?.includes('/upload/')) return src;
  return src.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

export default function ClubLogo({ name, src, size = 32 }) {
  if (!src) {
    return (
      <div
        className="shrink-0 flex items-center justify-center rounded-full bg-surface border border-border-strong"
        style={{ width: size, height: size }}
        title={name ?? ''}
      >
        <MapPin size={Math.round(size * 0.45)} className="text-cyan" />
      </div>
    );
  }
  return (
    <img
      src={cdnUrl(src, size * 2)}
      alt={name ?? ''}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-full object-cover border border-border-strong bg-surface"
      style={{ width: size, height: size }}
    />
  );
}
