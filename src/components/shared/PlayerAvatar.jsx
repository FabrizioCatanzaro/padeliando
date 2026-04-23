import { useState } from 'react';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  '#e8f04a', // brand
  '#4af07a', // green
  '#4ab8f0', // cyan
  '#f07a4a', // orange
  '#a84af0', // purple
  '#f04a7a', // pink
  '#4af0d0', // teal
  '#f0d04a', // yellow-warm
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function PlayerAvatar({ name, src, size = 32, className = '', style = {} }) {
  const [erroredSrc, setErroredSrc] = useState(null);

  const showImage = !!src && erroredSrc !== src;
  const initials  = getInitials(name);
  const color     = getAvatarColor(name || '');

  const baseStyle = {
    width: size,
    height: size,
    ...style,
  };

  if (showImage) {
    return (
      <img
        src={src}
        alt={name || ''}
        onError={() => setErroredSrc(src)}
        className={`rounded-full object-cover select-none shrink-0 ${className}`}
        style={{ ...baseStyle, border: `1.5px solid ${color}55` }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-condensed font-bold select-none shrink-0 ${className}`}
      style={{
        ...baseStyle,
        backgroundColor: `${color}1a`,
        border: `1.5px solid ${color}55`,
        color: color,
        fontSize: Math.round(size * 0.38),
        letterSpacing: 0.5,
      }}
    >
      {initials}
    </div>
  );
}

export function PairAvatar({ name1, name2, src1, src2, size = 32 }) {
  const overlap = Math.round(size * 0.05);
  return (
    <div className="flex items-center shrink-0" style={{ width: size * 2 - overlap }}>
      <PlayerAvatar name={name1} src={src1} size={size} style={{ zIndex: 1 }} />
      <PlayerAvatar name={name2} src={src2} size={size} style={{ marginLeft: -overlap, zIndex: 0 }} />
    </div>
  );
}
