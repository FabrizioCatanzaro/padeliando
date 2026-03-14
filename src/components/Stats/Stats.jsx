import { useState } from "react";
import { calcStandings } from "../../utils/helpers";
import { Bomb, Clock, Handshake, Swords, Trophy } from "lucide-react";

export default function Stats({ tournament }) {
  const [allTournaments] = useState([]);
  const [histTab, setHistTab] = useState("current");

  return (
    <div>
      <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-4">ESTADÍSTICAS</div>

      <div className="flex mb-5 border-b border-border">
        {[
          { id: "current", label: "Este torneo" },
          { id: "history", label: `Históricas (${allTournaments.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setHistTab(t.id)}
            className={`bg-transparent border-0 px-3.5 py-3.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer border-b-2 whitespace-nowrap transition-all ${histTab === t.id ? 'text-brand border-b-brand' : 'text-muted border-b-transparent'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {histTab === "current"
        ? <CurrentStats tournament={tournament} />
        : <HistoricalStats tournaments={allTournaments} />
      }
    </div>
  );
}

function CurrentStats({ tournament }) {
  const { players, matches } = tournament;
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
    .sort((a, b) => b.winRate - a.winRate);

  let biggestWin = null, biggestDiff = -1;
  played.forEach((m) => {
    const d = Math.abs(+m.score1 - +m.score2);
    if (d > biggestDiff) { biggestDiff = d; biggestWin = m; }
  });

  const longestMatch = played
    .filter((m) => m.duration_seconds > 0)
    .sort((a, b) => b.duration_seconds - a.duration_seconds)[0] ?? null;

  const getPlayerName = (id) => players.find((p) => p.id === id)?.name ?? "?";
  const leader = standings[0];
  const topPartner = partnerships[0];

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
        {leader && (
          <div className="bg-surface border border-brand/27 rounded-lg p-4 text-center flex flex-col items-center justify-center">
            <div className="text-4xl mb-2 flex justify-center text-brand"><Trophy size={30} /></div>
            <div className="font-condensed font-bold text-3xl text-brand mb-1">{leader.name}</div>
            <div className="text-sm text-muted font-sans">MVP · {leader.pg} victorias</div>
          </div>
        )}
        {topPartner?.played >= 1 && (
          <div className="bg-surface border border-cyan/27 rounded-lg p-4 text-center flex flex-col items-center justify-center">
            <div className="text-4xl mb-2 flex justify-center text-cyan"><Handshake size={30} /></div>
            <div className="font-condensed font-bold text-3xl text-cyan mb-1">{topPartner.label}</div>
            <div className="text-sm text-muted font-sans">Mejor pareja · {topPartner.winRate}% ({topPartner.wins}/{topPartner.played})</div>
          </div>
        )}
        {biggestWin && (
          <div className="bg-surface border border-danger/27 rounded-lg p-4 text-center flex flex-col items-center justify-center">
            <div className="text-3xl mb-2 flex justify-center text-danger"><Bomb size={30} /></div>
            <div className="font-condensed font-bold text-3xl text-danger mb-1">{biggestWin.score1} — {biggestWin.score2}</div>
            <div className="text-sm text-muted font-sans">Partido más amplio · {biggestWin.team1.map(getPlayerName).join(" & ")} vs {biggestWin.team2.map(getPlayerName).join(" & ")}</div>
          </div>
        )}
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
      <PartnershipsTable partnerships={partnerships} />
    </>
  );
}

function HistoricalStats({ tournaments }) {
  if (tournaments.length === 0)
    return <div className="text-center text-dim py-10 px-5 font-sans leading-loose">No hay jornadas anteriores registradas.</div>;

  const playerMap = {};
  tournaments.forEach((t) => {
    const standings = calcStandings(t.players, t.matches);
    standings.forEach((s) => {
      if (!playerMap[s.name]) playerMap[s.name] = { name: s.name, pj: 0, pg: 0, pp: 0, torneos: 0 };
      playerMap[s.name].pj += s.pj;
      playerMap[s.name].pg += s.pg;
      playerMap[s.name].pp += s.pp;
      if (s.pj > 0) playerMap[s.name].torneos++;
    });
  });

  const rows = Object.values(playerMap)
    .filter((r) => r.pj > 0)
    .sort((a, b) => b.pg - a.pg || b.pj - a.pj);

  const totalMatches = tournaments.reduce((acc, t) =>
    acc + t.matches.filter((m) => m.score1 !== "").length, 0);

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
        {rows[0] && (
          <div className="bg-surface border border-brand/27 rounded-lg p-4 text-center">
            <div className="text-[28px] mb-2">👑</div>
            <div className="font-condensed font-bold text-[26px] text-brand mb-1">{rows[0].name}</div>
            <div className="text-[12px] text-muted font-sans">Mejor jugador histórico · {rows[0].pg}V</div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">RANKING HISTÓRICO</div>
        <PerPlayerTable standings={rows} showTourneys />
      </div>

      <div className="mt-5">
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">JORNADAS</div>
        <div className="flex flex-col gap-1.5">
          {[...tournaments].reverse().map((t) => {
            const played = t.matches.filter((m) => m.score1 !== "").length;
            const winner = calcStandings(t.players, t.matches)[0];
            return (
              <div key={t.id} className="flex items-center gap-2 bg-base border border-border-mid rounded-md px-3 py-2 flex-col">
                <div className="flex justify-between w-full">
                  <span className="text-white font-condensed font-bold text-[16px]">{t.name}</span>
                  {winner && <span className="text-brand text-[13px]">🏆 {winner.name}</span>}
                </div>
                <span className="text-muted text-[11px] font-mono">
                  {new Date(t.createdAt).toLocaleDateString("es-AR")} · {t.players.length} jugadores · {played} partidos
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function PerPlayerTable({ standings, showTourneys }) {
  return (
    <div className="mt-4">
      {!showTourneys && (
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">RENDIMIENTO POR JUGADOR</div>
      )}
      <div className="flex flex-col gap-2">
        {standings.map((p, i) => {
          const pct = p.pj > 0 ? Math.round((p.pg / p.pj) * 100) : 0;
          return (
            <div key={p.id ?? p.name} className="flex items-center gap-3 bg-surface border border-border-mid rounded-md px-3.5 py-2.5">
              <div className="min-w-6 text-[#666] font-mono font-bold">{i + 1}</div>
              <div className="flex-1 font-semibold text-white">{p.name}</div>
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

function PartnershipsTable({ partnerships }) {
  if (partnerships.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted mb-3">PAREJAS</div>
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
