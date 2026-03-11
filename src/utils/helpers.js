export const uid = () => Math.random().toString(36).slice(2, 9);

export const fmt = (d) =>
  new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

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