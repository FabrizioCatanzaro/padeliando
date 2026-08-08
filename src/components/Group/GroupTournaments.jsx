import { useNavigate } from 'react-router-dom';
import { Users, User, Flame, Trophy, Building2 } from 'lucide-react';
import FadeInCard from '../shared/FadeInCard';
import Badge from '../shared/Badge';
import Btn from '../shared/Btn';
import TournamentFilters from './TournamentFilters';
import {
  fmt, fmtHora, tournamentDisplayStatus, isAmericanoDraft, TOURNAMENT_STATUS_META,
} from '../../utils/helpers';

// Listado de torneos de la categoría: la pestaña por defecto. Salió de GroupView
// cuando la pantalla pasó a tener pestañas, para que ese archivo no siguiera
// creciendo con el cuerpo de todas.
export default function GroupTournaments({
  group, groupId, canManage, filters, changeFilters, filtersOpen, setFiltersOpen,
  activeFilters, filtered, visibleCount, setVisibleCount,
}) {
  const navigate = useNavigate();

  return (
    <>
      {(!group.tournaments || group.tournaments.length === 0) && !canManage && (
        <div className="text-center text-dim py-10 px-5 font-sans leading-loose">No hay torneos todavía.<br/>¡Creá el primero!</div>
      )}

      {group.tournaments?.length > 0 && (
        <TournamentFilters
          filters={filters}
          onChange={changeFilters}
          open={filtersOpen}
          onToggle={() => setFiltersOpen(o => !o)}
          total={group.tournaments.length}
          shown={filtered.length}
        />
      )}

      {activeFilters > 0 && filtered.length === 0 && (
        <div className="text-center text-dim py-10 px-5 font-sans leading-loose">
          Ningún torneo coincide con los filtros.
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.slice(0, visibleCount).map((t, i) => {
          const isAmericano = t.format === 'americano';
          const fmtColor = isAmericano ? '#e8f04a' : '#63b3ed';
          const fmtBg    = isAmericano ? 'rgba(232,240,74,0.07)' : 'rgba(99,179,237,0.07)';
          const fmtBorder = isAmericano ? 'rgba(232,240,74,0.18)' : 'rgba(99,179,237,0.18)';
          const count = isAmericano ? t.pair_count : t.player_count;
          const CountIcon = isAmericano ? Users : User;
          const displayStatus = tournamentDisplayStatus({
            status: t.status, hasLiveMatch: !!t.live_match, hasPlayed: (t.match_count ?? 0) > 0,
            isDraft: isAmericanoDraft({ format: t.format, pairCount: t.pair_count }),
          });
          const statusMeta = TOURNAMENT_STATUS_META[displayStatus];
          // Línea superior: brand si es borrador, cyan si es próximo, verde si está en curso/en vivo, nada si finalizó.
          const topLineClass = displayStatus === 'draft'
            ? 'from-brand/50 via-brand/20 to-transparent'
            : displayStatus === 'upcoming'
              ? 'from-cyan/50 via-cyan/20 to-transparent'
              : 'from-green/50 via-green/20 to-transparent';
          return (
          <FadeInCard key={t.id} delay={Math.min(i, 5) * 60}
            className="border border-border-mid rounded-lg cursor-pointer overflow-hidden card-link"
            style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #1c1c1c 100%)' }}
            onClick={() => { navigate(`/cat/${groupId}/torneo/${t.id}`); }}>
            {displayStatus !== 'finished' && (
              <div className={`h-px ml-7 bg-gradient-to-r ${topLineClass}`} />
            )}
            <div className="flex min-w-0">
              <div
                className="flex items-center justify-center shrink-0 w-7"
                style={{ background: fmtBg, borderRight: `1px solid ${fmtBorder}` }}
              >
                <span
                  className="font-mono font-bold tracking-widest select-none"
                  style={{ fontSize: 8, color: fmtColor, writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.2em' }}
                >
                  {isAmericano ? 'AMERICANO' : 'LIGA'}
                </span>
              </div>
              <div className="px-4 py-3.5 flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="font-condensed font-bold text-lg text-content leading-tight">{t.name}</div>
                  <Badge variant="status" color={statusMeta.color} icon={statusMeta.icon} pulse={statusMeta.pulse}>
                    {statusMeta.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {count > 0 && (
                    <span className="flex items-center gap-1 font-mono text-sm text-dim">
                      <CountIcon size={11} />{count}
                    </span>
                  )}
                  {t.match_count > 0 && (
                    <span className="flex items-center gap-1 font-mono text-sm text-dim">
                      <Flame size={11} />{t.match_count}
                    </span>
                  )}
                  {!isAmericano && t.mode && (
                    <span className="font-mono text-sm text-dim">
                      {t.mode === 'pairs' ? '(en parejas)' : '(equipos libres)'}
                    </span>
                  )}
                  <span className="font-mono text-sm text-dim ml-auto">
                    {fmt(t.event_date ?? t.created_at)}
                    {t.event_time && <span className="text-brand ml-1.5">{fmtHora(t.event_time)}</span>}
                  </span>
                </div>
                {t.club_name && (
                  <div className="flex items-center gap-1.5 text-sm text-secondary font-mono mt-2">
                    <Building2 size={11} className="shrink-0" />
                    <span className="truncate">{t.club_name}</span>
                  </div>
                )}
                {t.status === 'finished' && t.winner_label && (
                  <div className="flex items-center gap-1.5 text-sm text-brand font-mono mt-2">
                    <Trophy size={11} /> {t.winner_label}
                  </div>
                )}
              </div>
            </div>
          </FadeInCard>
          );
        })}
      </div>
      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-4">
          <Btn size="sm" onClick={() => setVisibleCount(c => c + 10)}>
            CARGAR MÁS ({filtered.length - visibleCount} restantes)
          </Btn>
        </div>
      )}
    </>
  );
}
