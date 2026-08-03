import { MapPin, Building2, Users, Radio, CalendarDays } from 'lucide-react';
import FadeInCard from '../shared/FadeInCard';
import { fmtHora } from '../../utils/helpers';

// Las fechas sin hora se parsean como UTC y en Argentina retroceden un día.
function localDate(d) {
  const str = String(d);
  return new Date(str.length === 10 ? `${str}T00:00` : str);
}

const DAY_MS = 86400000;

// "HOY" y "MAÑANA" pesan más que la fecha; el resto se abrevia.
function dateLabel(eventDate) {
  if (!eventDate) return null;
  const d = localDate(eventDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / DAY_MS);
  if (diff === 0) return 'HOY';
  if (diff === 1) return 'MAÑANA';
  const s = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1).replace('.', '');
}

const CARD_BG = 'linear-gradient(145deg, #0d0d0d 0%, #1c1c1c 100%)';

export default function EventCard({ t, delay = 0, onClick, footer = null, badge = null, className = '' }) {
  const day = dateLabel(t.event_date);
  const hora = fmtHora(t.event_time);

  return (
    <FadeInCard
      delay={delay}
      className={`border border-border-mid rounded-lg cursor-pointer overflow-hidden card-link flex flex-col p-3.5 ${className}`}
      style={{ background: CARD_BG }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {t.group_emojis?.length > 0 && <span className="text-sm leading-none shrink-0">{t.group_emojis.join(' ')}</span>}
          <span className="font-mono text-[11px] text-muted truncate">{t.group_name}</span>
        </div>
        {badge}
      </div>

      <div className="font-condensed font-bold text-[17px] text-white leading-tight line-clamp-2">{t.name}</div>

      {(day || hora) && (
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-brand mt-1.5">
          <CalendarDays size={11} className="shrink-0" />
          <span className="truncate">{day}{hora && ` · ${hora}`}</span>
        </div>
      )}

      {t.club_name && (
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-secondary mt-1">
          <Building2 size={11} className="shrink-0" />
          <span className="truncate">{t.club_name}</span>
        </div>
      )}
      {!t.club_name && t.club_location_name && (
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-secondary mt-1">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{t.club_location_name}</span>
        </div>
      )}

      {t.player_count > 0 && (
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted mt-1">
          <Users size={11} className="shrink-0" />
          <span>{t.player_count} {t.player_count === 1 ? 'jugador' : 'jugadores'}</span>
        </div>
      )}

      {footer}

      <div className="font-mono text-[10px] text-dim mt-auto pt-2">@{t.owner_username}</div>
    </FadeInCard>
  );
}

export function LiveBadge() {
  return (
    <span className="shrink-0 inline-flex items-center gap-1 font-mono text-[9px] tracking-widest text-green border border-green/40 rounded-full px-1.5 py-0.5">
      <Radio size={9} />EN VIVO
    </span>
  );
}
