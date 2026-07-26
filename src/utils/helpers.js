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
    const s1 = parseInt(score1), s2 = parseInt(score2), win1 = s1 > s2;
    [...team1, ...team2].forEach((pid) => { if (s[pid]) s[pid].pj++; });
    team1.forEach((pid) => {
      if (!s[pid]) return;
      if (win1) { s[pid].pg++; s[pid].sf += s1; s[pid].sc += s2; }
      else       { s[pid].pp++; s[pid].sf += s1; s[pid].sc += s2; }
    });
    team2.forEach((pid) => {
      if (!s[pid]) return;
      if (!win1) { s[pid].pg++; s[pid].sf += s2; s[pid].sc += s1; }
      else        { s[pid].pp++; s[pid].sf += s2; s[pid].sc += s1; }
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
 * Calcula el label del ganador de un torneo (igual lógica que se muestra en torneos).
 * Para americano: ganador de la final del bracket.
 * Para parejas: pareja con más victorias.
 * Para libre: jugador con más victorias.
 */
export function getTournamentWinnerLabel(t) {
  const standings = calcStandings(t.players, t.matches);
  const isPairs   = t.mode === 'pairs' && t.pairs?.length > 0;

  if (t.format === 'americano') {
    return t.bracket?.final?.winner_name ?? null;
  } else if (isPairs) {
    if (t.status !== 'finished') return null;
    const pairRows = t.pairs.map((pair) => {
      const stats  = standings.find((r) => r.id === pair.p1) ?? standings.find((r) => r.id === pair.p2) ?? { pj: 0, pg: 0, sf: 0, sc: 0 };
      const p1Name = t.players.find((p) => p.id === pair.p1)?.name ?? '?';
      const p2Name = t.players.find((p) => p.id === pair.p2)?.name ?? '?';
      return { ...stats, id: pair.id, name: `${p1Name} & ${p2Name}` };
    }).sort((a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc));
    const topPg   = pairRows[0]?.pg ?? 0;
    const topDiff = pairRows[0] ? pairRows[0].sf - pairRows[0].sc : 0;
    const top     = pairRows.filter((p) => p.pj > 0 && p.pg === topPg && (p.sf - p.sc) === topDiff);
    return top.length > 0 ? top.map((p) => p.name).join(' / ') : null;
  } else {
    if (t.status !== 'finished') return null;
    const byWins  = [...standings].sort((a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc));
    const topPg   = byWins[0]?.pg ?? 0;
    const topDiff = byWins[0] ? byWins[0].sf - byWins[0].sc : 0;
    const top     = byWins.filter((s) => s.pj > 0 && s.pg === topPg && (s.sf - s.sc) === topDiff);
    return top.length > 0 ? top.map((s) => s.name).join(' / ') : null;
  }
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
