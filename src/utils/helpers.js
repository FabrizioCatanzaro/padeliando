export const uid = () => Math.random().toString(36).slice(2, 9);

// Cuenta anónima que hereda torneos huérfanos cuando un dueño elimina su cuenta.
// No tiene perfil público (el backend responde 404), así que no debe linkearse.
export const DELETED_ACCOUNT_USERNAME = 'cuenta_eliminada';
export const isDeletedAccount = (username) => username === DELETED_ACCOUNT_USERNAME;

// ── Set helpers ───────────────────────────────────────────────────────────────
// Un set tiene ganador cuando alguien llegó a 6+ (o 7 en tiebreak) y va ganando.
export function setWinner(s) {
  if (!s || s.s1 === s.s2) return null;
  return s.s1 > s.s2 ? 1 : 2;
}

export function setsWon(sets) {
  return sets.reduce(([w1, w2], s) => {
    const w = setWinner(s);
    return w === 1 ? [w1 + 1, w2] : w === 2 ? [w1, w2 + 1] : [w1, w2];
  }, [0, 0]);
}

// Cuántos sets mostrar en UI (reveal progresivo) o cuántos están jugados en un partido guardado.
export function visibleSetsCount(sets_format, sets) {
  if (sets_format === 1) return 1;
  if (sets_format !== 3 || !sets?.length) return 0;
  if (!setWinner(sets[0])) return 1;
  if (!sets[1] || !setWinner(sets[1])) return 2;
  const [w1, w2] = setsWon([sets[0], sets[1]]);
  return (w1 >= 2 || w2 >= 2) ? 2 : 3;
}

// Strings con solo fecha (YYYY-MM-DD) se parsean como UTC midnight en JS,
// lo que en Argentina (UTC-3) retrocede un día. Agregando T00:00 sin Z
// se fuerza el parseo en timezone local.
export const fmt = (d) => {
  const str = String(d);
  const date = new Date(str.length === 10 ? str + 'T00:00' : str);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

export const normalize = (s) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function calcStandings(players, matches) {
  const s = {};
  players.forEach((p) => {
    s[p.id] = { id: p.id, name: p.name, linked_username: p.linked_username ?? null, pj: 0, pg: 0, pp: 0, sf: 0, sc: 0 };
  });
  matches.forEach(({ team1, team2, score1, score2 }) => {
    if (score1 === "" || score2 === "") return;
    const s1 = parseInt(score1), s2 = parseInt(score2);
    if (Number.isNaN(s1) || Number.isNaN(s2)) return;
    // En padel no hay empate: un partido igualado es un dato inválido (sólo
    // puede venir de un registro viejo) y se descarta. Antes se colaba con la
    // condición `win1 = s1 > s2`, que en un 6-6 daba la victoria al equipo 2 y
    // la derrota al equipo 1.
    if (s1 === s2) return;
    [[team1, s1, s2], [team2, s2, s1]].forEach(([team, gf, gc]) => {
      team.forEach((pid) => {
        const row = s[pid];
        if (!row) return;
        row.pj++;
        row.sf += gf;
        row.sc += gc;
        if (gf > gc) row.pg++;
        else         row.pp++;
      });
    });
  });
  return Object.values(s).sort((a, b) => {
    const pctA = a.pj > 0 ? a.pg / a.pj : 0;
    const pctB = b.pj > 0 ? b.pg / b.pj : 0;
    return pctB - pctA || b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc);
  });
}

/** Returns the pair label for a given pair ID, or "?" */
export function getPairLabel(pairId, pairs, players) {
  const pair = pairs?.find((p) => p.id === pairId);
  if (!pair) return "?";
  const name1 = players.find((p) => p.id === pair.p1)?.name ?? "?";
  const name2 = players.find((p) => p.id === pair.p2)?.name ?? "?";
  return `${name1} & ${name2}`;
}

/** Expand a pair ID to [p1Id, p2Id] */
export function expandPair(pairId, pairs) {
  const pair = pairs?.find((p) => p.id === pairId);
  return pair ? [pair.p1, pair.p2] : [];
}

/**
 * Convierte un partido de la API al formato interno del frontend.
 * API:      { team1_p1, team1_p2, team2_p1, team2_p2, played_at }
 * Frontend: { team1: [id,id], team2: [id,id], date }
 */
export function adaptMatch(m) {
  return {
    ...m,
    // La API devuelve created_at; sin este alias los sort por createdAt daban NaN
    // y el orden quedaba a merced del ORDER BY del backend.
    createdAt:   m.created_at ?? m.createdAt ?? null,
    team1:       [m.team1_p1, m.team1_p2],
    team2:       [m.team2_p1, m.team2_p2],
    date:        m.played_at?.slice(0, 10) ?? m.date ?? '',
    sets:        m.sets ?? [],
    sets_format: m.sets_format ?? null,
    court:       m.court ?? null,
  };
}
 
/**
 * Convierte una pareja de la API al formato interno del frontend.
 * API:      { p1_id, p2_id }
 * Frontend: { p1, p2 }
 */
export function adaptPair(p) {
  return { ...p, p1: p.p1_id, p2: p.p2_id };
}
 
/**
 * Normaliza un torneo completo que viene de la API.
 * Convierte matches y pairs al formato interno.
 */
/**
 * Ganadores de un torneo, con los ids de los jugadores que los componen.
 * - Americano: la pareja que ganó la final del cuadro (sin importar el status).
 * - Parejas / libre: la pareja o jugador con más victorias (desempate por
 *   diferencia de games), sólo si el torneo está finalizado. Si hay igualdad
 *   exacta en la cima, son campeones todos los empatados.
 * Devuelve `[{ ids, name }]` — los ids permiten contar títulos por jugador sin
 * volver a parsear nombres.
 */
/**
 * Fecha en que se jugó un torneo, como YYYY-MM-DD. `created_at` es cuándo se
 * cargó la jornada, que en casi la mitad de los casos no es cuándo se jugó.
 * Prioridad: la fecha declarada del evento, el primer partido, y recién ahí la
 * de creación.
 */
export function tournamentDate(t) {
  if (t.event_date) return String(t.event_date).slice(0, 10);
  const dates = (t.matches ?? []).map((m) => m.date || m.played_at).filter(Boolean).map((d) => String(d).slice(0, 10));
  if (dates.length > 0) return dates.reduce((min, d) => (d < min ? d : min));
  return String(t.createdAt ?? t.created_at ?? '').slice(0, 10);
}

export function getTournamentWinners(t) {
  const nameOf = (id) => t.players.find((p) => p.id === id)?.name ?? '?';

  if (t.format === 'americano') {
    const winnerId = t.bracket?.final?.winner_id;
    if (!winnerId) return [];
    const pair = t.pairs?.find((p) => p.id === winnerId);
    // Sin la pareja en memoria queda el nombre guardado en el bracket, sin ids.
    if (!pair) return t.bracket?.final?.winner_name
      ? [{ ids: [], name: t.bracket.final.winner_name }]
      : [];
    return [{ ids: [pair.p1, pair.p2], name: `${nameOf(pair.p1)} & ${nameOf(pair.p2)}` }];
  }

  if (t.status !== 'finished') return [];

  const standings = calcStandings(t.players, t.matches);
  const isPairs   = t.mode === 'pairs' && t.pairs?.length > 0;

  const rows = isPairs
    ? t.pairs.map((pair) => {
        const stats = standings.find((r) => r.id === pair.p1)
                   ?? standings.find((r) => r.id === pair.p2)
                   ?? { pj: 0, pg: 0, sf: 0, sc: 0 };
        return { ...stats, ids: [pair.p1, pair.p2], name: `${nameOf(pair.p1)} & ${nameOf(pair.p2)}` };
      })
    : standings.map((s) => ({ ...s, ids: [s.id], name: s.name }));

  const byWins  = [...rows].sort((a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc));
  const topPg   = byWins[0]?.pg ?? 0;
  const topDiff = byWins[0] ? byWins[0].sf - byWins[0].sc : 0;
  return byWins
    .filter((r) => r.pj > 0 && r.pg === topPg && (r.sf - r.sc) === topDiff)
    .map((r) => ({ ids: r.ids, name: r.name }));
}

/**
 * Label del ganador de un torneo. Derivado de getTournamentWinners para que el
 * conteo de campeones no tenga que volver a parsear este string: los nombres
 * con " & " o " / " rompían ese parseo.
 */
export function getTournamentWinnerLabel(t) {
  const winners = getTournamentWinners(t);
  return winners.length > 0 ? winners.map((w) => w.name).join(' / ') : null;
}

/**
 * Nivel de padelero derivado del volumen y el % de victorias. Vivía duplicado
 * en ProfileView y ProfileStory, con etiquetas en distinta capitalización.
 * Devuelve el label capitalizado; la historia lo pasa a mayúsculas.
 */
export function calcNivel(partidos, pct) {
  if (partidos < 5) return null;
  if (pct >= 65) return { label: 'Maestro',    color: '#f0d04a' };
  if (pct >= 50) return { label: 'Avanzado',   color: '#4af07a' };
  if (pct >= 35) return { label: 'Intermedio', color: '#4ab8f0' };
  return { label: 'Amateur', color: '#888888' };
}

function patchBracketNames(bracket, pairs, players) {
  if (!bracket) return bracket;
  const nameByPair = {};
  for (const pair of pairs) {
    const p1 = players.find(p => p.id === pair.p1);
    const p2 = players.find(p => p.id === pair.p2);
    nameByPair[pair.id] = `${p1?.name ?? '?'} & ${p2?.name ?? '?'}`;
  }
  function patchMatch(m) {
    if (!m) return m;
    return {
      ...m,
      pair1_name:  m.pair1_id  ? (nameByPair[m.pair1_id]  ?? m.pair1_name)  : m.pair1_name,
      pair2_name:  m.pair2_id  ? (nameByPair[m.pair2_id]  ?? m.pair2_name)  : m.pair2_name,
      winner_name: m.winner_id ? (nameByPair[m.winner_id] ?? m.winner_name) : m.winner_name,
    };
  }
  return {
    ...bracket,
    standings: (bracket.standings ?? []).map(s => ({
      ...s,
      pair_name: s.pair_id ? (nameByPair[s.pair_id] ?? s.pair_name) : s.pair_name,
    })),
    octavos: (bracket.octavos ?? []).map(patchMatch),
    cuartos: (bracket.cuartos ?? []).map(patchMatch),
    semis:   (bracket.semis   ?? []).map(patchMatch),
    final:   patchMatch(bracket.final),
  };
}

// Cantidad de canchas que aporta un club para un torneo.
// Sin club → 1 (default). Club sin canchas cargadas → 0 (los partidos quedan con cancha "-").
export function clubCourts(club) {
  if (!club) return 1;
  const n = Number(club.courts);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Etiqueta de cancha a mostrar para un partido.
// - Si el torneo se juega en un club sin canchas cargadas (number_of_courts === 0) → '-'.
// - Si el partido tiene cancha asignada → su número.
// - Si no, null (no se muestra badge).
export function courtLabel(tournament, court) {
  if (tournament?.number_of_courts === 0) return '-';
  return court != null ? String(court) : null;
}

/**
 * Arma el texto plano del fixture de un torneo para compartir (WhatsApp, etc.).
 *
 *   NOMBRE TORNEO - Categoría
 *   Club | 📅 26/07/2026
 *
 *   Partido #1 (12:34 min)
 *   📍 Cancha 2: Ana & Bea [6] - 4 Caro & Dani
 *
 * El marcador del ganador va entre corchetes. Los partidos se numeran del más
 * viejo al más nuevo (igual que el #N de las tarjetas).
 *
 * @param {object} tournament  torneo ya normalizado por adaptTournament
 * @param {array}  matches     partidos a incluir (por defecto, los del torneo)
 * @param {object} opts        { bold, categoryName } → bold envuelve torneo,
 *                             categoría y "Partido #N" en * (negrita de WhatsApp)
 */
export function buildFixtureText(
  tournament,
  matches = tournament?.matches ?? [],
  { bold = false, categoryName } = {},
) {
  const { players = [], pairs = [], mode } = tournament ?? {};

  const teamLabel = (team = []) => {
    if (mode === 'pairs') {
      const pair = pairs?.find(
        (p) => (p.p1 === team[0] && p.p2 === team[1]) || (p.p1 === team[1] && p.p2 === team[0])
      );
      if (pair) return getPairLabel(pair.id, pairs, players);
    }
    return team.map((id) => players.find((p) => p.id === id)?.name ?? '?').join(' & ');
  };

  // Del más viejo al más nuevo: el #1 del fixture es el primer partido jugado.
  const playedAt = (m) => new Date(m.createdAt ?? m.created_at ?? m.date ?? 0).getTime();
  const played = matches
    .filter((m) => m.score1 !== '' && m.score1 != null && m.score2 !== '' && m.score2 != null)
    .slice()
    .sort((a, b) => playedAt(a) - playedAt(b));

  const b = (s) => (bold ? `*${s}*` : s);

  const category = categoryName ?? tournament?.group_name ?? null;
  const title = `🎾 ${[tournament?.name, category].filter(Boolean).map(b).join(' - ')}`;
  const place = `📍 ${tournament?.club_name || null}`;
  const when  = `📅 ${fmt(tournament?.event_date ?? tournament?.createdAt)}`;
  const header = [title, [place, when].filter(Boolean).join(' | ')].filter(Boolean).join('\n');

  if (played.length === 0) return `${header}\n\nTodavía no hay partidos jugados.`;

  const blocks = played.map((m, i) => {
    // Con 1 set mostramos el score del set, no los sets ganados (que sería 1-0)
    const s1 = m.sets_format === 1 ? (m.sets?.[0]?.s1 ?? m.score1) : m.score1;
    const s2 = m.sets_format === 1 ? (m.sets?.[0]?.s2 ?? m.score2) : m.score2;
    const win1 = parseInt(s1) > parseInt(s2);

    const score = win1 ? `[${s1}] - ${s2}` : `${s1} - [${s2}]`;
    const court = courtLabel(tournament, m.court);
    const prefix = court != null ? `Cancha ${court}: ` : '';

    // Parciales al final, sólo en partidos al mejor de 3 sets
    const nv = m.sets_format === 3 ? visibleSetsCount(m.sets_format, m.sets) : 0;
    const partials = nv > 0
      ? ` (${(m.sets ?? []).slice(0, nv).map((s) => `${s.s1}-${s.s2}`).join(', ')})`
      : '';

    // Duración sólo si el partido se cronometró
    const secs = m.duration_seconds;
    const dur = secs != null
      ? ` (${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')} min)`
      : '';

    return `${b(`Partido #${i + 1}`)}${dur}\n${prefix}${teamLabel(m.team1)} ${score} ${teamLabel(m.team2)}${partials}`;
  });

  return `${header}\n\n${blocks.join('\n\n')}`;
}

export function adaptTournament(t) {
  const players = (t.players ?? []).map(p => ({ ...p, name: p.linked_name ?? p.name }));
  const pairs   = (t.pairs   ?? []).map(adaptPair);
  return {
    ...t,
    createdAt: t.created_at ?? t.createdAt,
    // El americano siempre se juega por parejas. Si un dato viejo quedó con
    // mode='free' (bug al agregar jugadores), lo normalizamos para que la
    // sección de parejas, la tabla y el resto lo traten como corresponde.
    mode: t.format === 'americano' ? 'pairs' : t.mode,
    players,
    pairs,
    matches: (t.matches ?? []).map(adaptMatch),
    bracket: patchBracketNames(t.bracket, pairs, players),
  };
}

export const localDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Límites de parejas del formato americano.
export const AMERICANO_MIN_PAIRS = 8;
export const AMERICANO_MAX_PAIRS = 16;

// Un americano con menos de 8 parejas es un "borrador": se puede crear y seguir
// cargando parejas, pero no se puede jugar (ni calendario, ni partidos, ni cuadro).
export function isAmericanoDraft({ format, pairCount }) {
  return format === 'americano' && (pairCount ?? 0) < AMERICANO_MIN_PAIRS;
}

// Estado a mostrar de un torneo. Solo hay 4 estados: finished / draft / active / upcoming.
// - finished: el torneo está finalizado.
// - draft ('borrador'): americano con menos parejas que el mínimo — todavía no se puede jugar.
// - active ('en curso'): tiene un partido EN VIVO o ya tiene algún partido jugado.
// - upcoming ('próximamente'): sin partidos jugados y sin partido en vivo (la fecha no importa).
export function tournamentDisplayStatus({ status, hasLiveMatch, hasPlayed, isDraft = false }) {
  if (status === 'finished') return 'finished';
  if (isDraft) return 'draft';
  if (hasLiveMatch || hasPlayed) return 'active';
  return 'upcoming';
}

export const TOURNAMENT_STATUS_META = {
  draft:    { label: 'BORRADOR',     color: 'brand'   },
  upcoming: { label: 'PRÓXIMAMENTE', color: 'cyan'    },
  active:   { label: 'EN CURSO',     color: 'green'   },
  finished: { label: 'FINALIZADO',   color: 'default' },
};

// Avisos que el organizador resuelve desde la pestaña de gestión. Es la fuente
// única: la pestaña muestra el "!" cuando esto devuelve algo y los carteles de
// gestión se renderizan a partir de las mismas entradas, así no se desincronizan.
//   - americano-min-pairs: americano en borrador, faltan parejas para el mínimo.
//   - players-without-pair: modo parejas con jugadores activos sin pareja armada.
export function managementWarnings(tournament) {
  if (!tournament) return [];
  const { players = [], pairs = [], format, mode } = tournament;
  const activePlayers = players.filter((p) => !p.removed);
  const warnings = [];

  if (format === 'americano') {
    const missing = AMERICANO_MIN_PAIRS - pairs.length;
    if (missing > 0) warnings.push({ id: 'americano-min-pairs', missing });
  }

  if (mode === 'pairs') {
    const assigned = new Set(pairs.flatMap((p) => [p.p1, p.p2]));
    const free = activePlayers.filter((p) => !assigned.has(p.id));
    if (free.length > 0) warnings.push({ id: 'players-without-pair', players: free });
  }

  return warnings;
}

export const emptyForm = () => ({
  team1: ["", ""],
  team2: ["", ""],
  score1: 0,
  score2: 0,
  date: localDateStr(),
  duration_seconds: null,
  sets_format: null,
  sets: [],
  court: null,
});
