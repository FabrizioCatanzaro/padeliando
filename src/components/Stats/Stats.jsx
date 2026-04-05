import { useState } from "react";
import { calcStandings, adaptTournament, getTournamentWinnerLabel } from "../../utils/helpers";
import { Bomb, CalendarDays, Clock, Crown, Flame, Handshake, Swords, Trophy } from "lucide-react";
import { api } from "../../utils/api";

export default function Stats({ tournament }) {
  const [allTournaments, setAllTournaments] = useState([]);
  const [histTab,    setHistTab]    = useState("current");
  const [histLoaded, setHistLoaded] = useState(false);
  const [histLoading, setHistLoading] = useState(false);

  async function handleTabChange(id) {
    setHistTab(id);
    if (id === "history" && !histLoaded && tournament.group_id) {
      setHistLoading(true);
      try {
        const data = await api.groups.history(tournament.group_id);
        setAllTournaments(data.map(adaptTournament));
        setHistLoaded(true);
      } finally {
        setHistLoading(false);
      }
    }
  }

  return (
    <div>
      <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-4">ESTADÍSTICAS</div>

      <div className="flex mb-5 border-b border-border">
        {[
          { id: "current", label: "Esta jornada" },
          { id: "history", label: histLoaded ? `Históricas (${allTournaments.length})` : "Históricas" },
        ].map((t) => (
          <button key={t.id} onClick={() => handleTabChange(t.id)}
            className={`bg-transparent border-0 px-3.5 py-3.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer border-b-2 whitespace-nowrap transition-all ${histTab === t.id ? 'text-brand border-b-brand' : 'text-muted border-b-transparent'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {histTab === "current"
        ? <CurrentStats tournament={tournament} />
        : histLoading
          ? <div className="text-center text-dim py-10 font-mono text-sm">Cargando historial...</div>
          : <HistoricalStats tournaments={allTournaments} />
      }
    </div>
  );
}

function getAllMatches(tournament) {
  const { matches: previaMatches, format, bracket, pairs: tournamentPairs } = tournament;
  if (format !== 'americano' || !bracket || !tournamentPairs?.length) return previaMatches;
  const bracketMatches = [];
  [
    ...(bracket.octavos ?? []),
    ...(bracket.cuartos ?? []),
    ...(bracket.semis   ?? []),
    ...(bracket.final   ? [bracket.final] : []),
  ].forEach(m => {
    if (m.winner_id == null) return;
    const pair1 = tournamentPairs.find(p => p.id === m.pair1_id);
    const pair2 = tournamentPairs.find(p => p.id === m.pair2_id);
    if (!pair1 || !pair2) return;
    bracketMatches.push({
      id: m.id,
      team1: [pair1.p1, pair1.p2],
      team2: [pair2.p1, pair2.p2],
      score1: String(m.score1),
      score2: String(m.score2),
      duration_seconds: m.duration_seconds ?? 0,
    });
  });
  return [...previaMatches, ...bracketMatches];
}

function CurrentStats({ tournament }) {
  const { players, mode, pairs: tournamentPairs } = tournament;
  const isPairs = mode === "pairs";

  const matches = getAllMatches(tournament);
  const played    = matches.filter((m) => m.score1 !== "" && m.score2 !== "");
  const standings = calcStandings(players, matches);
  const isAmericano = tournament.format === 'americano';

  const partnerMap = {};
  played.forEach((m) => {
    [[m.team1, +m.score1 > +m.score2], [m.team2, +m.score2 > +m.score1]].forEach(([team, won]) => {
      const key = [...team].sort().join("-");
      if (!partnerMap[key]) partnerMap[key] = { wins: 0, played: 0, ids: team };
      partnerMap[key].played++;
      if (won) partnerMap[key].wins++;
    });
  });

  const partnerships = Object.values(partnerMap)
    .map((v) => ({
      label: v.ids.map((id) => players.find((p) => p.id === id)?.name ?? "?").join(" & "),
      winRate: v.played > 0 ? Math.round((v.wins / v.played) * 100) : 0,
      wins: v.wins, played: v.played,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

  let biggestWin = null, biggestDiff = -1;
  played.forEach((m) => {
    const d = Math.abs(+m.score1 - +m.score2);
    if (d > biggestDiff) {
      biggestDiff = d; biggestWin = m;
    } else if (d === biggestDiff && biggestWin) {
      // Desempate: el partido más corto (con duración registrada tiene prioridad)
      const mDur  = m.duration_seconds ?? 0;
      const curDur = biggestWin.duration_seconds ?? 0;
      if (mDur > 0 && (curDur === 0 || mDur < curDur)) biggestWin = m;
    }
  });

  const longestMatch = played.reduce((max, m) => {
    if (m.duration_seconds > (max?.duration_seconds ?? 0)) {
      return m;
    }
    return max;
  }, null);

  const shortestMatch = played.reduce((min, m) => {
    if (m.duration_seconds > 60 && (!min || m.duration_seconds < min.duration_seconds)) {
      return m;
    }
    return min;
  }, null);

  const getPlayerName = (id) => players.find((p) => p.id === id)?.name ?? "?";

  // Detectar empates en el TOP 1 (MVP)
  const topPg   = standings[0]?.pg ?? 0;
  const topDiff = standings[0] ? standings[0].sf - standings[0].sc : 0;
  const leaders = standings.filter((p) => p.pg === topPg && (p.sf - p.sc) === topDiff);
  const mvpLabel = leaders.map((p) => p.name).join(" / ");

  // Detectar empates entre las mejores parejas
  const topWinRate   = partnerships[0]?.winRate ?? -1;
  const topWins      = partnerships[0]?.wins ?? -1;
  const topPlayed    = partnerships[0]?.played ?? 0;
  const tiedPartners = partnerships.filter(
    (p) => p.winRate === topWinRate && p.wins === topWins && p.played === topPlayed
  );
  const topPartner        = tiedPartners.length === 1 ? partnerships[0] : null;
  const tiedPartnersLabel = tiedPartners.length > 1 ? tiedPartners.map((p) => p.label).join(" / ") : null;

  // Mejor pareja en modo pairs: usar las parejas fijas del torneo + sus stats
  let topPairLabel   = topPartner?.label ?? tiedPartnersLabel ?? null;
  let topPairWinRate = topPartner?.winRate ?? topWinRate;
  let topPairRecord  = topPartner ? `${topPartner.wins}/${topPartner.played}` : (topPlayed > 0 ? `${topWins}/${topPlayed}` : "");
  const topPairIsTied = tiedPartners.length > 1;

  if (!topPairIsTied && isPairs && tournamentPairs?.length > 0 && standings.length > 0) {
    const topFixedPair = tournamentPairs.find(
      (fp) => fp.p1 === standings[0]?.id || fp.p2 === standings[0]?.id
    );
    if (topFixedPair) {
      const n1 = players.find((p) => p.id === topFixedPair.p1)?.name ?? "?";
      const n2 = players.find((p) => p.id === topFixedPair.p2)?.name ?? "?";
      const key1 = [topFixedPair.p1, topFixedPair.p2].sort().join("-");
      const pairStats = partnerMap[key1];
      topPairLabel   = `${n1} & ${n2}`;
      topPairWinRate = pairStats ? Math.round((pairStats.wins / pairStats.played) * 100) : 0;
      topPairRecord  = pairStats ? `${pairStats.wins}/${pairStats.played}` : "0/0";
    }
  }  

  if (played.length === 0)
    return <div className="text-center text-dim py-10 px-5 font-sans leading-loose">Jugá partidos para ver estadísticas 📊</div>;

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mb-2">
        <div className="bg-surface border border-secondary/27 rounded-lg p-4 text-center flex flex-col items-center justify-center">
          <div className="text-4xl mb-2 text-secondary flex justify-center"><Swords size={30} /></div>
          <div className="font-condensed font-bold text-3xl text-white mb-1">{played.length}</div>
          <div className="text-sm text-muted font-sans">Partidos jugados</div>
        </div>
        {isAmericano && tournament.bracket?.final?.winner_id &&(
          <div className="bg-surface border border-amber-500/27 rounded-lg p-4 text-center flex flex-col items-center justify-center">
            <div className="text-4xl mb-2 flex justify-center text-amber-500"><Trophy size={30} /></div>
            <div className="font-condensed font-bold text-2xl text-amber-500 mb-1 leading-tight">{tournament.bracket?.final?.winner_name}</div>
            <div className="text-sm text-muted font-sans">
              C A M P E O N E S
            </div>
          </div>
        )}

        {/* En modo pairs el MVP individual no tiene sentido (ambos de la pareja tienen stats idénticas).
            Se muestra la mejor pareja en su lugar. En modo libre se muestra el MVP individual. */}
        {isPairs ? (
          topPairLabel && (
            <div className="bg-surface border border-brand/27 rounded-lg p-4 text-center flex flex-col items-center justify-center">
              <div className="text-4xl mb-2 flex justify-center text-brand"><Flame size={30} /></div>
              <div className="font-condensed font-bold text-2xl text-brand mb-1 leading-tight">{topPairLabel}</div>
              <div className="text-sm text-muted font-sans">
                {topPairIsTied ? `Rendimiento por parejas ${'\n'} Empatado` : "Mejor pareja"} · {topPairWinRate}% ({topPairRecord})
              </div>
            </div>
          )
        ) : (
          leaders.length > 0 && (
            <div className="bg-surface border border-brand/27 rounded-lg p-4 text-center flex flex-col items-center justify-center">
              <div className="text-4xl mb-2 flex justify-center text-brand"><Trophy size={30} /></div>
              <div className="font-condensed font-bold text-3xl text-brand mb-1 leading-tight">{mvpLabel}</div>
              <div className="text-sm text-muted font-sans">
                {leaders.length > 1 ? "Empate" : "MVP"} · {topPg} {topPg === 1 ? "victoria" : "victorias"}
              </div>
            </div>
          )
        )}

        {/* En modo libre se muestra la mejor pareja dinámica además del MVP */}
        {!isPairs && topPlayed >= 1 && (
          <div className="bg-surface border border-cyan/27 rounded-lg p-4 text-center flex flex-col items-center justify-center">
            <div className="text-4xl mb-2 flex justify-center text-cyan"><Handshake size={30} /></div>
            <div className={`${tiedPartners.length > 1 ? 'text-lg' :'text-3xl'} font-condensed font-bold text-3xl text-cyan mb-1 leading-tight`}>
              {topPairIsTied ? tiedPartnersLabel : topPartner.label}
            </div>
            <div className="text-sm text-muted font-sans">
              {topPairIsTied ? `Rendimiento por parejas ${'\n'} Empatado` : "Mejor pareja"} · {topWinRate}% ({topWins}/{topPlayed})
            </div>
          </div>
        )}

        {biggestWin && (() => {
          const win1        = +biggestWin.score1 > +biggestWin.score2;
          const winnerNames = (win1 ? biggestWin.team1 : biggestWin.team2).map(getPlayerName).join(" & ");
          const loserNames  = (win1 ? biggestWin.team2 : biggestWin.team1).map(getPlayerName).join(" & ");
          const winScore    = win1 ? biggestWin.score1 : biggestWin.score2;
          const loseScore   = win1 ? biggestWin.score2 : biggestWin.score1;
          return (
            <div className="bg-surface border border-danger/27 rounded-lg p-4 text-center flex flex-col items-center justify-center">
              <div className="text-3xl mb-2 flex justify-center text-danger"><Bomb size={30} /></div>
              <div className="font-condensed font-bold text-3xl mb-1">
                <span className="text-danger">{winScore}</span>
                <span className="text-danger"> — </span>
                <span className="text-danger">{loseScore}</span>
              </div>
              <div className="text-sm text-muted font-sans">
                Partido más amplio · <span className="text-white">{winnerNames}</span>
                <span className="text-muted"> vs {loserNames}</span>
              </div>
            </div>
          );
        })()}
        {longestMatch && (
          <div className="bg-surface border border-green/27 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2 flex justify-center text-green"><Clock size={30} /></div>
            <div className="font-condensed font-bold text-3xl text-green mb-1">
              {String(Math.floor(longestMatch.duration_seconds / 60)).padStart(2,"0")}:
              {String(longestMatch.duration_seconds % 60).padStart(2,"0")}
            </div>
            <div className="text-sm text-muted font-sans">
              Partido más largo · {longestMatch.team1.map(getPlayerName).join(" & ")} vs {longestMatch.team2.map(getPlayerName).join(" & ")}
            </div>
          </div>
        )}
        {shortestMatch && shortestMatch != longestMatch && (
          <div className="bg-surface border border-secondary/27 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2 flex justify-center text-secondary"><Clock size={30} /></div>
            <div className="font-condensed font-bold text-3xl text-secondary mb-1">
              {String(Math.floor(shortestMatch.duration_seconds / 60)).padStart(2,"0")}:
              {String(shortestMatch.duration_seconds % 60).padStart(2,"0")}
            </div>
            <div className="text-sm text-muted font-sans">
              Partido más rápido · {shortestMatch.team1.map(getPlayerName).join(" & ")} vs {shortestMatch.team2.map(getPlayerName).join(" & ")}
            </div>
          </div>
        )}
      </div>

      <PerPlayerTable standings={standings} />
      {!isPairs && <PartnershipsTable partnerships={partnerships} />}
      {isPairs && <PartnershipsTable partnerships={partnerships} titleOverride="RENDIMIENTO POR PAREJA" />}
    </>
  );
}

export function HistoricalStats({ tournaments, showJornadas = true }) {
  if (tournaments.length === 0)
    return <div className="text-center text-dim py-10 px-5 font-sans leading-loose">No hay jornadas anteriores registradas.</div>;

  const hasPairMode = tournaments.some((t) => t.mode === "pairs");
  const allPairMode = tournaments.every((t) => t.mode === "pairs");

  // ── Standings individuales (agrega por nombre de jugador) ──────────────
  const playerMap = {};
  tournaments.forEach((t) => {
    calcStandings(t.players, getAllMatches(t)).forEach((s) => {
      if (!playerMap[s.name]) playerMap[s.name] = { name: s.name, pj: 0, pg: 0, pp: 0, torneos: 0 };
      playerMap[s.name].pj += s.pj;
      playerMap[s.name].pg += s.pg;
      playerMap[s.name].pp += s.pp;
      if (s.pj > 0) playerMap[s.name].torneos++;
    });
  });
  const individualRows = Object.values(playerMap)
    .filter((r) => r.pj > 0)
    .sort((a, b) => {
      const pctA = a.pj > 0 ? a.pg / a.pj : 0;
      const pctB = b.pj > 0 ? b.pg / b.pj : 0;
      return pctB - pctA || b.pg - a.pg;
    });

  // ── Standings por pareja (solo jornadas en modo parejas) ───────────────
  const pairMap = {};
  if (hasPairMode) {
    const nameById = {};
    tournaments.forEach((t) => t.players.forEach((p) => { nameById[p.id] = p.name; }));

    tournaments.filter((t) => t.mode === "pairs").forEach((t) => {
      getAllMatches(t).forEach((m) => {
        const s1 = +m.score1, s2 = +m.score2;
        const win1 = s1 > s2;
        [[m.team1, s1, s2, win1], [m.team2, s2, s1, !win1]].forEach(([team, sf, sc, won]) => {
          const key   = [...team].sort().join("-");
          const label = team.map((id) => nameById[id] ?? "?").join(" & ");
          if (!pairMap[key]) pairMap[key] = { id: key, label, pj: 0, pg: 0, pp: 0, sf: 0, sc: 0 };
          pairMap[key].pj++;
          pairMap[key].sf += sf;
          pairMap[key].sc += sc;
          if (won) pairMap[key].pg++; else pairMap[key].pp++;
        });
      });
    });
  }
  const pairRows = Object.values(pairMap)
    .sort((a, b) => {
      const pctA = a.pj > 0 ? a.pg / a.pj : 0;
      const pctB = b.pj > 0 ? b.pg / b.pj : 0;
      return pctB - pctA || b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc);
    });

  // ── Mejor pareja histórica (con detección de empate) ──────────────────
  const topPct    = pairRows[0]?.pj > 0 ? pairRows[0].pg / pairRows[0].pj : 0;
  const tiedPairs = pairRows.filter((p) => p.pj > 0 && (p.pg / p.pj) === topPct && p.pg === pairRows[0]?.pg);
  const bestPairLabel  = tiedPairs.length > 1 ? tiedPairs.map((p) => p.label).join(" / ") : tiedPairs[0]?.label ?? null;
  const bestPairIsTied = tiedPairs.length > 1;
  const bestPairRecord = !bestPairIsTied && tiedPairs[0] ? `${tiedPairs[0].pg}/${tiedPairs[0].pj}` : null;

  // ── Más veces campeón ────────────────────────────────────────────────────
  const champCount = {};
  tournaments.forEach((t) => {
    const label = getTournamentWinnerLabel(t);
    if (!label) return;
    // "A & B / C & D" → split por " / " (empates) y luego por " & " (miembros de pareja)
    label.split(" / ").forEach((winner) => {
      winner.split(" & ").forEach((name) => {
        const n = name.trim();
        if (n) champCount[n] = (champCount[n] ?? 0) + 1;
      });
    });
  });
  const champRows     = Object.entries(champCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const topChampCount = champRows[0]?.count ?? 0;
  const topChamps     = champRows.filter((c) => c.count === topChampCount);
  const champLabel    = topChamps.map((c) => c.name).join(" / ");

  function bracketPlayedCount(t) {
    if (t.format !== 'americano' || !t.bracket) return 0;
    return [...(t.bracket.octavos ?? []), ...(t.bracket.cuartos ?? []),
            ...(t.bracket.semis   ?? []), ...(t.bracket.final ? [t.bracket.final] : [])]
      .filter(m => m.winner_id != null).length;
  }
  const totalMatches = tournaments.reduce((acc, t) => acc + t.matches.length + bracketPlayedCount(t), 0);

  // Si TODAS las jornadas son en parejas → tabla por pareja; sino → tabla individual
  const showPairTable = allPairMode && pairRows.length > 0;

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mb-2">
        <div className="flex flex-col items-center gap-1 bg-surface border border-cyan/27 rounded-lg p-4 text-center">
          <CalendarDays size={30} className="mb-2 text-cyan" />
          <div className="font-condensed font-bold text-[26px] text-white mb-1">{tournaments.length}</div>
          <div className="text-[12px] text-muted font-sans">Jornadas jugadas</div>
        </div>
        <div className="flex flex-col items-center gap-1 bg-surface border border-border-mid rounded-lg p-4 text-center">
          <Swords size={30} className="text-secondary mb-2" />
          <div className="font-condensed font-bold text-[26px] text-white mb-1">{totalMatches}</div>
          <div className="text-[12px] text-muted font-sans">Partidos en total</div>
        </div>
        {individualRows[0] && (
          <div className="flex flex-col items-center gap-1 bg-surface border border-brand/27 rounded-lg p-4 text-center">
            <Crown size={30} className="mb-2 text-brand" />
            <div className="font-condensed font-bold text-[26px] text-brand mb-1">{individualRows[0].name}</div>
            <div className="text-[12px] text-muted font-sans">Mejor jugador histórico · {individualRows[0].pg}V</div>
          </div>
        )}
        {champLabel && (
          <div className="flex flex-col items-center gap-1 bg-surface border border-amber-500/27 rounded-lg p-4 text-center">
            <Trophy size={30} className="mb-2 text-amber-500" />
            <div className={`font-condensed font-bold text-amber-500 mb-1 leading-tight ${topChamps.length > 1 ? 'text-lg' : 'text-[26px]'}`}>{champLabel}</div>
            <div className="text-[12px] text-muted font-sans">
              {topChamps.length > 1 ? `Empatados · ` : "Más veces campeón · "}{topChampCount} {topChampCount === 1 ? "jornada" : "jornadas"}
            </div>
          </div>
        )}
        {hasPairMode && bestPairLabel && (
          <div className="flex flex-col items-center gap-1 bg-surface border border-green/27 rounded-lg p-4 text-center">
            <Handshake size={30} className="mb-2 text-green" />
            <div className="font-condensed font-bold text-xl text-green mb-1 leading-tight">{bestPairLabel}</div>
            <div className="text-[12px] text-muted font-sans">
              {bestPairIsTied ? "Empate · Mejor pareja histórica" : `Mejor pareja histórica${bestPairRecord ? ` · ${bestPairRecord}` : ""}`}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">
          {showPairTable ? "RANKING HISTÓRICO POR PAREJAS" : "RANKING HISTÓRICO"}
        </div>
        {showPairTable
          ? <PerPlayerTable standings={pairRows} useLabelKey />
          : <PerPlayerTable standings={individualRows} showTourneys />
        }
      </div>

      {showJornadas && 
      <div className="mt-5">
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">JORNADAS</div>
        <div className="flex flex-col gap-1.5">
          {[...tournaments].reverse().map((t) => {
            const winnerLabel = getTournamentWinnerLabel(t);

            return (
              <div key={t.id} className="flex items-center gap-2 bg-base border border-border-mid rounded-md px-3 py-2 flex-col">
                <div className="flex justify-between w-full">
                  <span className="text-white font-condensed font-bold text-[16px]">{t.name}</span>
                  {winnerLabel && <span className="text-brand text-[13px] flex items-center gap-2 justify-center"><Trophy size={13} /> {winnerLabel}</span>}
                </div>
                <span className="text-muted text-[11px] font-mono">
                  {new Date(t.createdAt).toLocaleDateString("es-AR")} · {t.format === 'americano' ? `${t.pairs?.length ?? 0} parejas` : `${t.players.length} jugadores`} · {t.matches.length + bracketPlayedCount(t)} partidos
                </span>
              </div>
            );
          })}
        </div>
      </div>
      }
    </>
  );
}

function PerPlayerTable({ standings, showTourneys, useLabelKey }) {
  return (
    <div className="mt-4">
      {!showTourneys && !useLabelKey && (
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">RENDIMIENTO POR JUGADOR</div>
      )}
      <div className="flex flex-col gap-2">
        {standings.map((p, i) => {
          const pct = p.pj > 0 ? Math.round((p.pg / p.pj) * 100) : 0;
          return (
            <div key={p.id ?? p.name} className="flex items-center gap-3 bg-surface border border-border-mid rounded-md px-3.5 py-2.5">
              <div className="min-w-6 text-[#666] font-mono font-bold">{i + 1}</div>
              <div className="flex-1 font-semibold text-white">{useLabelKey ? p.label : p.name}</div>
              {showTourneys && (
                <div className="min-w-12.5 text-muted text-[11px] font-mono">{p.torneos}J</div>
              )}
              <div className="flex-2">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-[width] duration-500 ${pct > 60 ? 'bg-brand' : pct > 40 ? 'bg-cyan' : 'bg-danger'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="min-w-20 text-right font-mono text-soft text-[13px]">
                {p.pg}G {p.pp}P <span className={pct >= 50 ? "text-brand" : "text-danger"}>({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PartnershipsTable({ partnerships, titleOverride }) {
  if (partnerships.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">
        {titleOverride ?? "PAREJAS"}
      </div>
      <div className="flex flex-col gap-2">
        {partnerships.map((p, i) => (
          <div key={i} className="flex items-center gap-3 bg-surface border border-border-mid rounded-md px-3.5 py-2.5">
            <div className="flex-1 text-content text-[14px]">{p.label}</div>
            <div className="flex-2">
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-cyan rounded-full" style={{ width: `${p.winRate}%` }} />
              </div>
            </div>
            <div className="min-w-22.5 text-right font-mono text-soft text-[13px]">
              {p.wins}G {p.played - p.wins}P <span className="text-cyan">({p.winRate}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
