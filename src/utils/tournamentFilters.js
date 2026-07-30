import { tournamentDisplayStatus, isAmericanoDraft } from './helpers';

export const EMPTY_FILTERS = { q: '', statuses: [], formats: [], from: '', to: '' };

export const STATUS_ORDER = ['draft', 'upcoming', 'active', 'finished'];

const DIACRITICS = new RegExp('[\u0300-\u036f]', 'g');

const norm = (s) => String(s ?? '')
  .normalize('NFD').replace(DIACRITICS, '')
  .toLowerCase().trim();

// La jornada se ubica por su fecha de juego, no por cuándo se cargó.
const dateOf = (t) => String(t.event_date ?? t.created_at ?? '').slice(0, 10);

// Mismo estado que muestra la tarjeta, para que el chip y la insignia no difieran.
export function statusOf(t) {
  return tournamentDisplayStatus({
    status: t.status,
    hasLiveMatch: !!t.live_match,
    hasPlayed: (t.match_count ?? 0) > 0,
    isDraft: isAmericanoDraft({ format: t.format, pairCount: t.pair_count }),
  });
}

export function countActiveFilters(f) {
  return (f.q.trim() ? 1 : 0) + f.statuses.length + f.formats.length + (f.from ? 1 : 0) + (f.to ? 1 : 0);
}

export function filterTournaments(list, f) {
  if (!list?.length) return [];
  const q = norm(f.q);
  return list.filter((t) => {
    if (q && !norm(t.name).includes(q) && !norm(t.club_name).includes(q)) return false;
    if (f.formats.length && !f.formats.includes(t.format === 'americano' ? 'americano' : 'liga')) return false;
    if (f.statuses.length && !f.statuses.includes(statusOf(t))) return false;
    if (f.from || f.to) {
      const d = dateOf(t);
      if (!d) return false;
      if (f.from && d < f.from) return false;
      if (f.to   && d > f.to)   return false;
    }
    return true;
  });
}
