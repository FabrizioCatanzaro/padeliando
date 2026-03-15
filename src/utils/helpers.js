export const uid = () => Math.random().toString(36).slice(2, 9);

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

export const normalize = (s) => s.trim().toLowerCase();

export function calcStandings(players, matches) {
  const s = {};
  players.forEach((p) => {
    s[p.id] = { id: p.id, name: p.name, pj: 0, pg: 0, pp: 0, sf: 0, sc: 0 };
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
  return Object.values(s).sort(
    (a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc)
  );
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
    team1: [m.team1_p1, m.team1_p2],
    team2: [m.team2_p1, m.team2_p2],
    date:  m.played_at?.slice(0, 10) ?? m.date ?? '',
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
export function adaptTournament(t) {
  return {
    ...t,
    createdAt: t.created_at ?? t.createdAt,
    matches:   (t.matches ?? []).map(adaptMatch),
    pairs:     (t.pairs   ?? []).map(adaptPair),
  };
}

export const localDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const emptyForm = () => ({
  team1: ["", ""],
  team2: ["", ""],
  score1: 0,
  score2: 0,
  date: localDateStr(),
  duration_seconds: null,
});
