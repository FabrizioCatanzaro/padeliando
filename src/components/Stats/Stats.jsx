import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calcStandings, adaptTournament, getTournamentWinnerLabel } from "../../utils/helpers";
import { Bomb, CalendarDays, Clock, Crown, Flame, Gem, Handshake, Swords, Trophy } from "lucide-react";
import { api } from "../../utils/api";
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import PremiumModal from "../shared/PremiumModal";
import ShareStoryButton from "../Snapshot/ShareStoryButton";
import SnapshotModal from "../Snapshot/SnapshotModal";
import StatsStory from "../Snapshot/StatsStory";
import { C } from "../Snapshot/story-theme";
import groupStatsPreview from "../../assets/group-advanced-stats-preview.svg";

export default function Stats({ tournament, ownerIsPremium = false }) {
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
          { id: "current", label: "Este torneo" },
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
          : <HistoricalStats tournaments={allTournaments} ownerIsPremium={ownerIsPremium} groupName={tournament.group_name} />
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
  const navigate = useNavigate();
  const [showStory, setShowStory] = useState(false);
  const { players, mode, pairs: tournamentPairs } = tournament;
  const isPairs = mode === "pairs";

  const matches = getAllMatches(tournament);
  const played    = matches.filter((m) => m.score1 !== "" && m.score2 !== "");
  const standings = calcStandings(players, matches);
  const isAmericano = tournament.format === 'americano';

  const partnerMap = {};
  played.forEach((m) => {
    const s1 = +m.score1, s2 = +m.score2;
    [[m.team1, s1, s2], [m.team2, s2, s1]].forEach(([team, gf, gc]) => {
      const key = [...team].sort().join("-");
      if (!partnerMap[key]) partnerMap[key] = { wins: 0, played: 0, sf: 0, sc: 0, ids: team };
      partnerMap[key].played++;
      partnerMap[key].sf += gf;
      partnerMap[key].sc += gc;
      if (gf > gc) partnerMap[key].wins++;
    });
  });

  const partnerships = Object.values(partnerMap)
    .map((v) => ({
      label: v.ids.map((id) => players.find((p) => p.id === id)?.name ?? "?").join(" & "),
      winRate: v.played > 0 ? Math.round((v.wins / v.played) * 100) : 0,
      wins: v.wins, played: v.played, diff: v.sf - v.sc,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins || b.diff - a.diff);

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
  const topPairDiff  = partnerships[0]?.diff ?? 0;
  const tiedPartners = partnerships.filter(
    (p) => p.winRate === topWinRate && p.wins === topWins && p.played === topPlayed && p.diff === topPairDiff
  );
  const topPartner        = tiedPartners.length === 1 ? partnerships[0] : null;
  const tiedPartnersLabel = tiedPartners.length > 1 ? tiedPartners.map((p) => p.label).join(" / ") : null;

  // Mejor pareja en modo pairs: usar las parejas fijas del torneo + sus stats
  let topPairLabel   = topPartner?.label ?? tiedPartnersLabel ?? null;
  let topPairWinRate = topPartner?.winRate ?? topWinRate;
  let topPairRecord  = topPartner ? `${topPartner.wins}/${topPartner.played}` : (topPlayed > 0 ? `${topWins}/${topPlayed}` : "");
  let topPairDiffVal = topPartner?.diff ?? topPairDiff;
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
      topPairDiffVal = pairStats ? pairStats.sf - pairStats.sc : 0;
    }
  }
  const fmtDiff = (d) => `${d > 0 ? "+" : ""}${d}`;

  if (played.length === 0)
    return <div className="text-center text-dim py-10 px-5 font-sans leading-loose">Jugá partidos para ver estadísticas 📊</div>;

  // ── Highlights para la historia exportable ──────────────────────────────────
  const storyHero = (() => {
    if (isAmericano && tournament.bracket?.final?.winner_id)
      return { emoji: "🏆", label: "CAMPEONES", main: tournament.bracket.final.winner_name, accent: C.amber };
    if (isPairs && topPairLabel)
      return { emoji: "🔥", label: topPairIsTied ? "MEJOR PAREJA · EMPATE" : "MEJOR PAREJA", main: topPairLabel, sub: `${topPairWinRate}% (${topPairRecord})`, accent: C.brand };
    if (leaders.length > 0)
      return { emoji: "🏆", label: leaders.length > 1 ? "MVP · EMPATE" : "MVP", main: mvpLabel, sub: `${topPg} ${topPg === 1 ? "victoria" : "victorias"}`, accent: C.brand };
    return null;
  })();

  const storyItems = [{ label: "PARTIDOS JUGADOS", main: played.length, accent: C.cyan }];
  if (!isPairs && topPlayed >= 1 && topPartner)
    storyItems.push({ emoji: "🤝", label: "MEJOR PAREJA", main: topPartner.label, sub: `${topWinRate}% (${topWins}/${topPlayed})`, accent: C.cyan });
  if (biggestWin) {
    const win1 = +biggestWin.score1 > +biggestWin.score2;
    const winnerNames = (win1 ? biggestWin.team1 : biggestWin.team2).map(getPlayerName).join(" & ");
    const ws = win1 ? biggestWin.score1 : biggestWin.score2;
    const ls = win1 ? biggestWin.score2 : biggestWin.score1;
    storyItems.push({ emoji: "💣", label: "PARTIDO MÁS AMPLIO", main: `${ws} — ${ls}`, sub: winnerNames, accent: C.danger });
  }
  if (longestMatch) {
    const win1 = +longestMatch.score1 > +longestMatch.score2;
    const winnerNames = (win1 ? longestMatch.team1 : longestMatch.team2).map(getPlayerName).join(" & ");
    const mm = String(Math.floor(longestMatch.duration_seconds / 60)).padStart(2, "0");
    const ss = String(longestMatch.duration_seconds % 60).padStart(2, "0");
    storyItems.push({ emoji: "⏱️", label: "PARTIDO MÁS LARGO", main: `${mm}:${ss}`, sub: winnerNames, accent: C.green });
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <ShareStoryButton onClick={() => setShowStory(true)} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mb-6">
        <div className="flex flex-col bg-surface border border-secondary/27 rounded-lg text-center overflow-hidden">
          <div className="bg-secondary text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-secondary/15">Partidos jugados</div>
          <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 pt-3 pb-4">
            <Swords size={30} className="text-secondary" />
            <div className="font-condensed font-bold text-[26px] text-white">{played.length}</div>
          </div>
        </div>
        {isAmericano && tournament.bracket?.final?.winner_id &&(
          <div className="flex flex-col bg-surface border border-amber-500/27 rounded-lg text-center overflow-hidden">
            <div className="bg-amber-500 text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-amber-500/15">Campeones</div>
            <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 pt-3 pb-4">
              <Trophy size={30} className="text-amber-500" />
              <div className="font-condensed font-bold text-xl text-amber-500 leading-tight">{tournament.bracket?.final?.winner_name}</div>
            </div>
          </div>
        )}

        {/* En modo pairs el MVP individual no tiene sentido (ambos de la pareja tienen stats idénticas).
            Se muestra la mejor pareja en su lugar. En modo libre se muestra el MVP individual. */}
        {isPairs ? (
          topPairLabel && (
            <div className="flex flex-col bg-surface border border-brand/27 rounded-lg text-center overflow-hidden">
              <div className="bg-brand text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-brand/15">
                {topPairIsTied ? "Mejor pareja · Empate" : "Mejor pareja"}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 pt-3 pb-4">
                <Flame size={30} className="text-brand" />
                <div className={`font-condensed font-bold ${topPairIsTied ? 'text-lg' : 'text-xl'} text-brand leading-tight`}>{topPairLabel}</div>
                <div className="text-[14px] text-secondary font-mono">{topPairWinRate}% ({topPairRecord}) · DIF {fmtDiff(topPairDiffVal)}</div>
              </div>
            </div>
          )
        ) : (
          leaders.length > 0 && (
            <div className="flex flex-col bg-surface border border-brand/27 rounded-lg text-center overflow-hidden">
              <div className="bg-brand text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-brand/15">
                {leaders.length > 1 ? "MVP · Empate" : "MVP"}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 pt-3 pb-4">
                <Trophy size={30} className="text-brand" />
                <div
                  className={`font-condensed font-bold text-xl text-brand leading-tight ${leaders.length === 1 && leaders[0].linked_username ? 'cursor-pointer hover:opacity-75 transition-opacity' : ''}`}
                  onClick={() => leaders.length === 1 && leaders[0].linked_username && navigate(`/u/${leaders[0].linked_username}`)}
                >
                  {mvpLabel}
                </div>
                <div className="text-[14px] text-secondary font-mono">{topPg} {topPg === 1 ? "victoria" : "victorias"}</div>
              </div>
            </div>
          )
        )}

        {/* En modo libre se muestra la mejor pareja dinámica además del MVP */}
        {!isPairs && topPlayed >= 1 && (
          <div className="flex flex-col bg-surface border border-cyan/27 rounded-lg text-center overflow-hidden">
            <div className="bg-cyan text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-cyan/15">
              {topPairIsTied ? "Mejor pareja · Empate" : "Mejor pareja"}
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 pt-3 pb-4">
              <Handshake size={30} className="text-cyan" />
              <div className={`font-condensed font-bold ${topPairIsTied ? 'text-lg' : 'text-xl'} text-cyan leading-tight`}>
                {topPairIsTied ? tiedPartnersLabel : topPartner.label}
              </div>
              <div className="text-[14px] text-secondary font-mono">{topWinRate}% ({topWins}/{topPlayed}) · DIF {fmtDiff(topPairDiffVal)}</div>
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
            <div className="flex flex-col bg-surface border border-danger/27 rounded-lg text-center overflow-hidden">
              <div className="bg-danger text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-danger/15">Partido más amplio</div>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 pt-3 pb-4">
                <Bomb size={30} className="text-danger" />
                <div className="font-condensed font-bold text-[26px] text-danger leading-tight">{winScore} — {loseScore}</div>
                <div className="text-[13px] text-secondary font-mono">
                  <span className="text-white">{winnerNames}</span> vs {loserNames}
                </div>
              </div>
            </div>
          );
        })()}
        {longestMatch && (() => {
          const win1        = +longestMatch.score1 > +longestMatch.score2;
          const winnerNames = (win1 ? longestMatch.team1 : longestMatch.team2).map(getPlayerName).join(" & ");
          const loserNames  = (win1 ? longestMatch.team2 : longestMatch.team1).map(getPlayerName).join(" & ");
          return (
            <div className="flex flex-col bg-surface border border-green/27 rounded-lg text-center overflow-hidden">
              <div className="bg-green text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-green/15">Partido más largo</div>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 pt-3 pb-4">
                <Clock size={30} className="text-green" />
                <div className="font-condensed font-bold text-[26px] text-green leading-tight">
                  {String(Math.floor(longestMatch.duration_seconds / 60)).padStart(2,"0")}:
                  {String(longestMatch.duration_seconds % 60).padStart(2,"0")}
                </div>
                <div className="text-[13px] text-secondary font-mono">
                  <span className="text-white">{winnerNames}</span> vs {loserNames}
                </div>
              </div>
            </div>
          );
        })()}
        {shortestMatch && shortestMatch != longestMatch && (() => {
          const win1        = +shortestMatch.score1 > +shortestMatch.score2;
          const winnerNames = (win1 ? shortestMatch.team1 : shortestMatch.team2).map(getPlayerName).join(" & ");
          const loserNames  = (win1 ? shortestMatch.team2 : shortestMatch.team1).map(getPlayerName).join(" & ");
          return (
            <div className="flex flex-col bg-surface border border-secondary/27 rounded-lg text-center overflow-hidden">
              <div className="bg-secondary text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-secondary/15">Partido más rápido</div>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 pt-3 pb-4">
                <Clock size={30} className="text-secondary" />
                <div className="font-condensed font-bold text-[26px] text-secondary leading-tight">
                  {String(Math.floor(shortestMatch.duration_seconds / 60)).padStart(2,"0")}:
                  {String(shortestMatch.duration_seconds % 60).padStart(2,"0")}
                </div>
                <div className="text-[13px] text-secondary font-mono">
                  <span className="text-white">{winnerNames}</span> vs {loserNames}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {!isPairs && !isAmericano && <PerPlayerTable standings={standings} />}
      {!isPairs && <PartnershipsTable partnerships={partnerships} />}
      {isPairs && <PartnershipsTable partnerships={partnerships} titleOverride="RENDIMIENTO POR PAREJA" />}

      {showStory && (
        <SnapshotModal
          filename={`stats-${tournament.name ?? "torneo"}.png`}
          onClose={() => setShowStory(false)}
          story={<StatsStory eyebrow="ESTADÍSTICAS DEL TORNEO" title={tournament.name} accent={C.brand} hero={storyHero} items={storyItems} />}
        />
      )}
    </>
  );
}

function buildIndividualRows(tournaments, sortBy = 'winrate') {
  const playerMap = {};
  tournaments.forEach((t) => {
    const nameById = Object.fromEntries(t.players.map((p) => [p.id, p.name]));
    calcStandings(t.players, getAllMatches(t)).forEach((s) => {
      if (!playerMap[s.name]) playerMap[s.name] = { name: s.name, linked_username: s.linked_username ?? null, pj: 0, pg: 0, pp: 0, torneos: 0, sf: 0, sc: 0 };
      if (s.linked_username && !playerMap[s.name].linked_username) playerMap[s.name].linked_username = s.linked_username;
      playerMap[s.name].pj += s.pj;
      playerMap[s.name].pg += s.pg;
      playerMap[s.name].pp += s.pp;
      if (s.pj > 0) playerMap[s.name].torneos++;
    });
    getAllMatches(t).forEach((m) => {
      const s1 = +m.score1 || 0, s2 = +m.score2 || 0;
      [[m.team1, s1, s2], [m.team2, s2, s1]].forEach(([team, sf, sc]) => {
        team.forEach((id) => {
          const name = nameById[id];
          if (name && playerMap[name]) { playerMap[name].sf += sf; playerMap[name].sc += sc; }
        });
      });
    });
  });
  return Object.values(playerMap)
    .filter((r) => r.pj > 0)
    .sort((a, b) => {
      const pctA = a.pj > 0 ? a.pg / a.pj : 0;
      const pctB = b.pj > 0 ? b.pg / b.pj : 0;
      // 'wins': prioriza partidos ganados sin importar el porcentaje.
      if (sortBy === 'wins') return b.pg - a.pg || pctB - pctA || (b.sf - b.sc) - (a.sf - a.sc);
      // 'winrate' (default): prioriza el porcentaje de victorias.
      return pctB - pctA || b.pg - a.pg;
    });
}

export function HistoricalStats({ tournaments, showTorneos = true, ownerIsPremium = false, groupName }) {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [rankMode, setRankMode] = useState('winrate'); // 'winrate' | 'wins'
  const [showStory, setShowStory] = useState(false);
  const navigate = useNavigate();

  if (tournaments.length === 0)
    return <div className="text-center text-dim py-10 px-5 font-sans leading-loose">No hay torneos anteriores registrados.</div>;

  const hasPairMode = tournaments.some((t) => t.mode === "pairs");
  const allPairMode = tournaments.every((t) => t.mode === "pairs");

  // ── Standings individuales + movimiento de ranking ──────────────────────
  const sortedByDate = [...tournaments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  // Base por rendimiento (%): se usa para las tarjetas y gráficos (mejor jugador, etc.).
  const individualRows = buildIndividualRows(sortedByDate);
  // Orden del ranking según el switch (rendimiento % o partidos ganados).
  const rankedRows = rankMode === 'wins' ? buildIndividualRows(sortedByDate, 'wins') : individualRows;

  const movementMap = (() => {
    if (sortedByDate.length < 2) return {};
    const prevRows = buildIndividualRows(sortedByDate.slice(0, -1), rankMode);
    const prevRank = Object.fromEntries(prevRows.map((r, i) => [r.name, i + 1]));
    return Object.fromEntries(
      rankedRows.map((r, i) => {
        const prev = prevRank[r.name];
        const curr = i + 1;
        if (!prev) return [r.name, 'new'];
        if (curr < prev) return [r.name, 'up'];
        if (curr > prev) return [r.name, 'down'];
        return [r.name, null];
      })
    );
  })();

  // ── Standings por pareja ────────────────────────────────────────────────
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

  // ── Mejor pareja histórica ──────────────────────────────────────────────
  const topPct    = pairRows[0]?.pj > 0 ? pairRows[0].pg / pairRows[0].pj : 0;
  const tiedPairs = pairRows.filter((p) => p.pj > 0 && (p.pg / p.pj) === topPct && p.pg === pairRows[0]?.pg);
  const bestPairLabel  = tiedPairs.length > 1 ? tiedPairs.map((p) => p.label).join(" / ") : tiedPairs[0]?.label ?? null;
  const bestPairIsTied = tiedPairs.length > 1;
  const bestPairRecord = !bestPairIsTied && tiedPairs[0] ? `${tiedPairs[0].pg}/${tiedPairs[0].pj}` : null;

  // ── Más veces campeón ──────────────────────────────────────────────────
  const champCount = {};
  tournaments.forEach((t) => {
    const label = getTournamentWinnerLabel(t);
    if (!label) return;
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
  const showPairTable = allPairMode && pairRows.length > 0;

  // ── Datos para gráficos avanzados ──────────────────────────────────────
  const champChartData = champRows.slice(0, 5).map((c) => ({ name: c.name.split(' ')[0], torneos: c.count }));

  const pointDiffChartData = [...individualRows]
    .filter((r) => r.pj >= 2)
    .sort((a, b) => (b.sf - b.sc) - (a.sf - a.sc))
    .slice(0, 7)
    .map((r) => ({ name: r.name.split(' ')[0], diff: r.sf - r.sc }));

  const activityChartData = [...tournaments]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((t) => {
      const totalMatches = t.matches.length + bracketPlayedCount(t);
      const totalGames = t.matches.reduce((acc, m) => acc + (+m.score1 || 0) + (+m.score2 || 0), 0);
      const label = new Date(t.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
      return { name: label, partidos: totalMatches, games: totalGames };
    });

  // ── Highlights para la historia exportable de la categoría ──────────────────
  const catHero = champLabel
    ? { emoji: "🏆", label: topChamps.length > 1 ? "MÁS VECES CAMPEONES" : "MÁS VECES CAMPEÓN", main: champLabel, sub: `${topChampCount} ${topChampCount === 1 ? "torneo" : "torneos"}`, accent: C.amber }
    : null;
  const catItems = [
    { label: "TORNEOS", main: tournaments.length, accent: C.cyan },
    { label: "PARTIDOS", main: totalMatches, accent: C.green },
  ];
  if (individualRows[0])
    catItems.push({ emoji: "👑", label: "MEJOR JUGADOR", main: individualRows[0].name, sub: `${individualRows[0].pg}V`, accent: C.brand });
  if (hasPairMode && bestPairLabel)
    catItems.push({ emoji: "🤝", label: bestPairIsTied ? "MEJOR PAREJA · EMPATE" : "MEJOR PAREJA", main: bestPairLabel, sub: bestPairRecord ?? undefined, accent: C.green });

  return (
    <>
      <div className="flex justify-end mb-4">
        <ShareStoryButton onClick={() => setShowStory(true)} />
      </div>

      {/* ── BÁSICAS (siempre visibles) ── */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mb-6">
        <div className="bg-surface border border-cyan/27 rounded-lg text-center overflow-hidden">
          <div className="text-surface text-[11px] bg-cyan font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-cyan/15">Torneos jugados</div>
          <div className="flex flex-col items-center gap-1 px-4 pt-3 pb-4">
            <CalendarDays size={30} className="text-cyan" />
            <div className="font-condensed font-bold text-[26px] text-white">{tournaments.length}</div>
          </div>
        </div>
        <div className="bg-surface border border-secondary/27 rounded-lg text-center overflow-hidden">
          <div className="bg-secondary text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-secondary/15">Partidos en total</div>
          <div className="flex flex-col items-center gap-1 px-4 pt-3 pb-4">
            <Swords size={30} className="text-secondary" />
            <div className="font-condensed font-bold text-[26px] text-white">{totalMatches}</div>
          </div>
        </div>
        {champLabel && (
          <div className="bg-surface border border-amber-500/27 rounded-lg text-center overflow-hidden">
            <div className="bg-amber-500 text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-amber-500/15">
              {topChamps.length > 1 ? "Empate · Más veces campeones" : "Más veces campeón"}
            </div>
            <div className="flex flex-col items-center gap-1 px-4 pt-3 pb-4">
              <Trophy size={30} className="text-amber-500" />
              <div className={`font-condensed font-bold text-amber-500 leading-tight ${topChamps.length > 1 ? 'text-lg' : 'text-xl'}`}>{champLabel}</div>
              <div className="text-[14px] text-secondary font-mono">{topChampCount} {topChampCount === 1 ? "torneo" : "torneos"}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── AVANZADAS (solo si el dueño tiene premium) ── */}
      {ownerIsPremium ? (
        <>
          <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted my-5 py-4 border-t border-border">ESTADÍSTICAS AVANZADAS</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mb-6">
            {individualRows[0] && (() => {
              const best = individualRows[0];
              return (
                <div className="bg-surface border border-brand/27 rounded-lg text-center overflow-hidden">
                  <div className="bg-brand text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-brand/15">Mejor jugador histórico</div>
                  <div className="flex flex-col items-center gap-1 px-4 pt-3 pb-4">
                    <Crown size={30} className="text-brand" />
                    <div
                      className={`font-condensed font-bold text-xl text-brand leading-tight ${best.linked_username ? 'cursor-pointer hover:opacity-75 transition-opacity' : ''}`}
                      onClick={() => best.linked_username && navigate(`/u/${best.linked_username}`)}
                    >
                      {best.name}
                    </div>
                    <div className="text-[14px] text-secondary font-mono">{best.pg}V</div>
                  </div>
                </div>
              );
            })()}
            {hasPairMode && bestPairLabel && (
              <div className="bg-surface border border-green/27 rounded-lg text-center overflow-hidden">
                <div className="bg-green text-surface text-[11px] font-condensed font-bold tracking-[1.5px] uppercase pt-2.5 pb-1.5 border-b border-green/15">
                  {bestPairIsTied ? "Empate · Mejor pareja histórica" : "Mejor pareja histórica"}
                </div>
                <div className="flex flex-col items-center gap-1 px-4 pt-3 pb-4">
                  <Handshake size={30} className="text-green" />
                  <div className="font-condensed font-bold text-xl text-green leading-tight">{bestPairLabel}</div>
                  {!bestPairIsTied && bestPairRecord && (
                    <div className="text-[14px] text-secondary font-mono">{bestPairRecord}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted">
                {showPairTable ? "RANKING HISTÓRICO POR PAREJAS" : "RANKING HISTÓRICO"}
              </div>
              {!showPairTable && (
                <div className="flex bg-surface border border-border-mid rounded-md p-0.5">
                  {[
                    { id: 'winrate', label: 'Por rendimiento' },
                    { id: 'wins',    label: 'Por ganados' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRankMode(opt.id)}
                      className={`px-2.5 py-1 text-[11px] font-condensed font-bold tracking-wide rounded-sm transition-colors cursor-pointer ${
                        rankMode === opt.id ? 'bg-brand text-base' : 'bg-transparent text-muted hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {showPairTable
              ? <PerPlayerTable standings={pairRows} useLabelKey />
              : <PerPlayerTable standings={rankedRows} movementMap={movementMap} sortBy={rankMode} />
            }
          </div>

          {/* Gráficos avanzados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {champChartData.length > 0 && (
              <div className="bg-surface border border-border-mid rounded-lg p-4">
                <div className="text-[10px] font-mono tracking-[2px] text-muted mb-3">CAMPEONES</div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={champChartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 4, fontSize: 11 }} cursor={{ fill: '#ffffff06' }} />
                    <Bar dataKey="torneos" name="Torneos ganados" fill="#e8f04a" radius={[0, 3, 3, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {pointDiffChartData.length > 0 && (
              <div className="bg-surface border border-border-mid rounded-lg p-4">
                <div className="text-[10px] font-mono tracking-[2px] text-muted mb-3">DIFERENCIAL DE GAMES (mín. 2PJ)</div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={pointDiffChartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 4, fontSize: 11 }} cursor={{ fill: '#ffffff06' }} formatter={(v) => [`${v > 0 ? '+' : ''}${v}`, 'Diferencial']} />
                    <Bar
                      dataKey="diff"
                      name="Diferencial"
                      barSize={12}
                      shape={({ x, y, width, height, value }) => (
                        <rect
                          x={width < 0 ? x + width : x}
                          y={y}
                          width={Math.abs(width)}
                          height={height}
                          fill={value >= 0 ? '#4af07a' : '#f04a4a'}
                          rx={3}
                        />
                      )}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {activityChartData.length > 1 && (
            <div className="bg-surface border border-border-mid rounded-lg p-4 mb-6">
              <div className="text-[10px] font-mono tracking-[2px] text-muted mb-3">EVOLUCIÓN POR TORNEO</div>
              <div className="flex items-center gap-4 mb-3">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted">
                  <span className="inline-block w-3 h-3 rounded-sm bg-[#4ab8f0]" />Partidos
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted">
                  <span className="inline-block w-4 h-0.5 bg-brand" />Games totales
                </span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <ComposedChart data={activityChartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 4, fontSize: 11 }}
                    cursor={{ fill: '#ffffff06' }}
                  />
                  <Bar yAxisId="left" dataKey="partidos" name="Partidos" fill="#4ab8f0" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="games" name="Games totales" stroke="#e8f04a" strokeWidth={2} dot={{ r: 3, fill: '#e8f04a', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="relative rounded-lg overflow-hidden select-none mb-6 border border-border-mid">
          <img
            src={groupStatsPreview}
            alt=""
            aria-hidden="true"
            draggable="false"
            className="w-full rounded-lg"
            style={{ filter: 'blur(5px)', transform: 'scale(1.03)' }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-base/55 rounded-lg">
            <div className="flex items-center gap-2">
              <Gem size={18} className="text-brand" />
              <span className="font-condensed font-bold text-base text-white tracking-wide">ESTADÍSTICAS AVANZADAS</span>
            </div>
            <p className="text-xs font-sans text-secondary text-center px-6 max-w-xs">
              El dueño de esta categoría necesita Premium para desbloquear estas estadísticas.
            </p>
            <button
              type="button"
              onClick={() => setShowPremiumModal(true)}
              className="flex items-center gap-2 bg-brand text-base border-0 px-4 py-2 font-condensed font-bold text-sm tracking-wide cursor-pointer rounded-lg"
            >
              <Gem size={13} /> CONOCER PREMIUM
            </button>
          </div>
        </div>
      )}

      {showTorneos && (
        <div className="mt-6">
          <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">TORNEOS</div>
          <div className="flex flex-col gap-2">
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
      )}

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}

      {showStory && (
        <SnapshotModal
          filename={`stats-categoria${groupName ? "-" + groupName : ""}.png`}
          onClose={() => setShowStory(false)}
          story={
            <StatsStory
              eyebrow="ESTADÍSTICAS DE LA CATEGORÍA"
              title={groupName ?? "Histórico"}
              subtitle={`${tournaments.length} torneos · ${totalMatches} partidos`}
              accent={C.brand}
              hero={catHero}
              items={catItems}
            />
          }
        />
      )}
    </>
  );
}

function PerPlayerTable({ standings, showTourneys, useLabelKey, movementMap = {}, sortBy = 'winrate' }) {
  const navigate = useNavigate();
  const winsActive = sortBy === 'wins';
  return (
    <div className="mt-4">
      {!showTourneys && !useLabelKey && (
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">RENDIMIENTO POR JUGADOR</div>
      )}
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 mb-2">
        <div className="shrink-0 w-8" />
        <div className="flex-1 min-w-0 text-[10px] font-mono tracking-[2px] text-dim">NOMBRE</div>
        <div className="shrink-0 w-7 text-[10px] font-mono tracking-[2px] text-dim text-center">J</div>
        <div className="shrink-0 w-14 text-[10px] font-mono tracking-[2px] text-dim text-center">WIN RATE</div>
        <div className={`shrink-0 w-7 text-[10px] font-mono tracking-[2px] text-center ${winsActive ? 'text-brand' : 'text-dim'}`}>G</div>
        <div className="shrink-0 w-7 text-[10px] font-mono tracking-[2px] text-dim text-center">P</div>
        <div className="shrink-0 w-9 text-[10px] font-mono tracking-[2px] text-dim text-right">%</div>
      </div>

      <div className="flex flex-col gap-2">
        {standings.map((p, i) => {
          const pct = p.pj > 0 ? Math.round((p.pg / p.pj) * 100) : 0;
          const username = p.linked_username ?? null;
          const displayName = useLabelKey ? p.label : p.name;
          const movement = movementMap[p.name] ?? null;
          return (
            <div key={p.id ?? p.name} className="flex items-center gap-2 bg-surface border border-border-mid rounded-md px-3.5 py-2.5">
              <div className="shrink-0 w-8 flex items-center gap-0.5">
                <span className="text-[#666] font-mono font-bold text-[13px]">{i + 1}</span>
                {movement === 'up'   && <span className="text-green   text-[9px] leading-none">▲</span>}
                {movement === 'down' && <span className="text-danger  text-[9px] leading-none">▼</span>}
                {movement === 'new'  && <span className="text-brand   text-[8px] leading-none font-bold font-mono">N</span>}
              </div>
              <div
                className={`flex-1 min-w-0 truncate font-semibold text-white ${username ? 'cursor-pointer hover:text-brand transition-colors' : ''}`}
                onClick={() => username && navigate(`/u/${username}`)}
              >
                {displayName}
              </div>
              <div className="shrink-0 w-7 text-center font-mono text-soft text-[13px]">{p.torneos ?? '-'}</div>
              <div className="shrink-0 w-14">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-[width] duration-500 ${pct > 60 ? 'bg-brand' : pct > 40 ? 'bg-cyan' : 'bg-danger'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className={`shrink-0 w-7 text-center font-mono text-[13px] ${winsActive ? 'text-brand font-bold' : 'text-soft'}`}>{p.pg}</div>
              <div className="shrink-0 w-7 text-center font-mono text-soft text-[13px]">{p.pp}</div>
              <div className="shrink-0 w-9 text-right font-mono text-[13px]">
                <span className={pct >= 50 ? "text-brand" : "text-danger"}>{pct}%</span>
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
