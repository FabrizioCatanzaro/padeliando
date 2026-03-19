import { useState } from "react";
import { calcStandings, adaptTournament } from "../../utils/helpers";
import { Bomb, Clock, Handshake, Swords, Trophy } from "lucide-react";
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

function CurrentStats({ tournament }) {
  const { players, matches, mode, pairs: tournamentPairs } = tournament;
  const isPairs = mode === "pairs";
  const played    = matches.filter((m) => m.score1 !== "" && m.score2 !== "");
  const standings = calcStandings(players, matches);

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
    if (d > biggestDiff) { biggestDiff = d; biggestWin = m; }
  });

  const longestMatch = played
    .filter((m) => m.duration_seconds > 0)
    .sort((a, b) => b.duration_seconds - a.duration_seconds)[0] ?? null;

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

        {/* En modo pairs el MVP individual no tiene sentido (ambos de la pareja tienen stats idénticas).
            Se muestra la mejor pareja en su lugar. En modo libre se muestra el MVP individual. */}
        {isPairs ? (
          topPairLabel && (
            <div className="bg-surface border border-brand/27 rounded-lg p-4 text-center flex flex-col items-center justify-center">
              <div className="text-4xl mb-2 flex justify-center text-brand"><Trophy size={30} /></div>
              <div className="font-condensed font-bold text-2xl text-brand mb-1 leading-tight">{topPairLabel}</div>
              <div className="text-sm text-muted font-sans">
                {topPairIsTied ? "Empate" : "Mejor pareja"} · {topPairWinRate}% ({topPairRecord})
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
              Partido más extenso · {longestMatch.team1.map(getPlayerName).join(" & ")} vs {longestMatch.team2.map(getPlayerName).join(" & ")}
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

function HistoricalStats({ tournaments }) {
  if (tournaments.length === 0)
    return <div className="text-center text-dim py-10 px-5 font-sans leading-loose">No hay jornadas anteriores registradas.</div>;

  const hasPairMode = tournaments.some((t) => t.mode === "pairs");
  const allPairMode = tournaments.every((t) => t.mode === "pairs");

  // ── Standings individuales (agrega por nombre de jugador) ──────────────
  const playerMap = {};
  tournaments.forEach((t) => {
    calcStandings(t.players, t.matches).forEach((s) => {
      if (!playerMap[s.name]) playerMap[s.name] = { name: s.name, pj: 0, pg: 0, pp: 0, torneos: 0 };
      playerMap[s.name].pj += s.pj;
      playerMap[s.name].pg += s.pg;
      playerMap[s.name].pp += s.pp;
      if (s.pj > 0) playerMap[s.name].torneos++;
    });
  });
  const individualRows = Object.values(playerMap)
    .filter((r) => r.pj > 0)
    .sort((a, b) => b.pg - a.pg || b.pj - a.pj);  

  // ── Standings por pareja (solo jornadas en modo parejas) ───────────────
  const pairMap = {};
  if (hasPairMode) {
    const nameById = {};
    tournaments.forEach((t) => t.players.forEach((p) => { nameById[p.id] = p.name; }));

    tournaments.filter((t) => t.mode === "pairs").forEach((t) => {
      t.matches.forEach((m) => {
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
    .sort((a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc));

  // ── Mejor pareja histórica (con detección de empate) ──────────────────
  const topPg   = pairRows[0]?.pg ?? -1;
  const topDiff = pairRows[0] ? pairRows[0].sf - pairRows[0].sc : 0;
  const tiedPairs = pairRows.filter((p) => p.pj > 0 && p.pg === topPg && (p.sf - p.sc) === topDiff);
  const bestPairLabel  = tiedPairs.length > 1 ? tiedPairs.map((p) => p.label).join(" / ") : tiedPairs[0]?.label ?? null;
  const bestPairIsTied = tiedPairs.length > 1;
  const bestPairRecord = !bestPairIsTied && tiedPairs[0] ? `${tiedPairs[0].pg}/${tiedPairs[0].pj}` : null;

  const totalMatches = tournaments.reduce((acc, t) => acc + t.matches.length, 0);

  // Si TODAS las jornadas son en parejas → tabla por pareja; sino → tabla individual
  const showPairTable = allPairMode && pairRows.length > 0;

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mb-2">
        <div className="bg-surface border border-border-mid rounded-lg p-4 text-center">
          <div className="text-[28px] mb-2">📅</div>
          <div className="font-condensed font-bold text-[26px] text-white mb-1">{tournaments.length}</div>
          <div className="text-[12px] text-muted font-sans">Jornadas jugadas</div>
        </div>
        <div className="bg-surface border border-border-mid rounded-lg p-4 text-center">
          <div className="text-[28px] mb-2">🎾</div>
          <div className="font-condensed font-bold text-[26px] text-white mb-1">{totalMatches}</div>
          <div className="text-[12px] text-muted font-sans">Partidos en total</div>
        </div>
        {individualRows[0] && (
          <div className="bg-surface border border-brand/27 rounded-lg p-4 text-center">
            <div className="text-[28px] mb-2">👑</div>
            <div className="font-condensed font-bold text-[26px] text-brand mb-1">{individualRows[0].name}</div>
            <div className="text-[12px] text-muted font-sans">Mejor jugador histórico · {individualRows[0].pg}V</div>
          </div>
        )}
        {hasPairMode && bestPairLabel && (
          <div className="bg-surface border border-cyan/27 rounded-lg p-4 text-center">
            <div className="text-[28px] mb-2">🤝</div>
            <div className="font-condensed font-bold text-xl text-cyan mb-1 leading-tight">{bestPairLabel}</div>
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

      <div className="mt-5">
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">JORNADAS</div>
        <div className="flex flex-col gap-1.5">
          {[...tournaments].reverse().map((t) => {
            const standings = calcStandings(t.players, t.matches);
            const isPairs   = t.mode === "pairs" && t.pairs?.length > 0;

            let winnerLabel = null;
            if (isPairs) {
              // Construir standings por pareja y detectar empate
              const pairRows = t.pairs.map((pair) => {
                const stats  = standings.find((r) => r.id === pair.p1) ?? standings.find((r) => r.id === pair.p2) ?? { pj: 0, pg: 0, sf: 0, sc: 0 };
                const p1Name = t.players.find((p) => p.id === pair.p1)?.name ?? "?";
                const p2Name = t.players.find((p) => p.id === pair.p2)?.name ?? "?";
                return { ...stats, id: pair.id, name: `${p1Name} & ${p2Name}` };
              }).sort((a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc));

              const topPg   = pairRows[0]?.pg ?? 0;
              const topDiff = pairRows[0] ? pairRows[0].sf - pairRows[0].sc : 0;
              const top     = pairRows.filter((p) => p.pj > 0 && p.pg === topPg && (p.sf - p.sc) === topDiff);
              if (top.length > 0) winnerLabel = top.map((p) => p.name).join(" / ");
            } else {
              // Modo libre: el o los mejores jugadores
              const topPg   = standings[0]?.pg ?? 0;
              const topDiff = standings[0] ? standings[0].sf - standings[0].sc : 0;
              const top     = standings.filter((s) => s.pj > 0 && s.pg === topPg && (s.sf - s.sc) === topDiff);
              if (top.length > 0) winnerLabel = top.map((s) => s.name).join(" / ");
            }

            return (
              <div key={t.id} className="flex items-center gap-2 bg-base border border-border-mid rounded-md px-3 py-2 flex-col">
                <div className="flex justify-between w-full">
                  <span className="text-white font-condensed font-bold text-[16px]">{t.name}</span>
                  {winnerLabel && <span className="text-brand text-[13px]">🏆 {winnerLabel}</span>}
                </div>
                <span className="text-muted text-[11px] font-mono">
                  {new Date(t.createdAt).toLocaleDateString("es-AR")} · {t.players.length} jugadores · {t.matches.length} partidos
                </span>
              </div>
            );
          })}
        </div>
      </div>
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
