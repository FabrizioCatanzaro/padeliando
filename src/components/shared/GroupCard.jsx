import { Globe, Lock, MapPin, Navigation, Users, Trophy } from 'lucide-react';
import FadeInCard from './FadeInCard';

export default function GroupCard({ g, delay = 0, badge = null, onClick }) {
  return (
    <FadeInCard
      delay={delay}
      className="border border-border-mid rounded-lg cursor-pointer overflow-hidden card-link flex flex-col"
      style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #1c1c1c 100%)' }}
      onClick={onClick}
    >
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2 flex-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            {g.emojis?.length > 0 && (
              <span className="text-lg leading-none shrink-0">{g.emojis.join(' ')}</span>
            )}
            <span className="font-condensed font-bold text-[19px] text-white leading-tight line-clamp-2">{g.name}</span>
          </div>
          {g.owner_username && (
            <div className="font-mono text-[11px] text-dim">@{g.owner_username}</div>
          )}
          {g.description && (
            <div className="font-sans text-[12px] text-secondary mt-1 line-clamp-2">{g.description}</div>
          )}
          {g.location_name && (
            <div className="flex items-center gap-1 font-mono text-[11px] text-dim mt-1.5">
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{g.location_name}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {g.is_public != null && (
            <span className={g.is_public ? 'text-cyan/50' : 'text-yellow-400/50'}>
              {g.is_public ? <Globe size={13} /> : <Lock size={13} />}
            </span>
          )}
          {badge && (
            <span className="font-mono text-[10px] text-green border border-green/30 px-1.5 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
      </div>
      {(g.player_count != null || g.tournament_count != null || g.distance_km != null) && (
        <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 bg-surface/40">
          {g.player_count != null && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-dim">
              <Users size={11} className="shrink-0" />{g.player_count}
            </span>
          )}
          {g.tournament_count != null && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-dim">
              <Trophy size={11} className="shrink-0" />{g.tournament_count} {g.tournament_count === 1 ? 'torneo' : 'torneos'}
            </span>
          )}
          {g.distance_km != null && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-brand ml-auto">
              <Navigation size={10} />{g.distance_km} km
            </span>
          )}
        </div>
      )}
    </FadeInCard>
  );
}
