import { useState, useEffect } from "react";
import { calcStandings } from "../../utils/helpers";
import S from "../../styles/theme";

export default function Stats({ tournament }) {
  const [allTournaments, setAllTournaments] = useState([]);
  const [histTab, setHistTab] = useState("current");

  useEffect(() => {
    setAllTournaments([])
  }, []);

  return (
    <div>
      <div style={S.sectionTitle}>ESTADÍSTICAS</div>

      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #1a1f2e" }}>
        {[
          { id: "current", label: "Este torneo" },
          { id: "history", label: `Históricas (${allTournaments.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setHistTab(t.id)}
            style={{ ...S.tab, fontSize: 13, ...(histTab === t.id ? S.tabActive : {}) }}>
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
  //console.log("longestMach", played);
  

  const getPlayerName = (id) => players.find((p) => p.id === id)?.name ?? "?";
  const leader = standings[0];
  const topPartner = partnerships[0];

  if (played.length === 0)
    return <div style={S.empty}>Jugá partidos para ver estadísticas 📊</div>;

  return (
    <>
      <div style={S.statsGrid}>
        <div style={S.statCard}>
          <div style={S.statIcon}>🎾</div>
          <div style={S.statValue}>{played.length}</div>
          <div style={S.statLabel}>Partidos jugados</div>
        </div>
        {leader && (
          <div style={{ ...S.statCard, borderColor: "#e8f04a44" }}>
            <div style={S.statIcon}>🏆</div>
            <div style={{ ...S.statValue, color: "#e8f04a" }}>{leader.name}</div>
            <div style={S.statLabel}>MVP · {leader.pg} victorias</div>
          </div>
        )}
        {topPartner?.played >= 1 && (
          <div style={{ ...S.statCard, borderColor: "#4af0c844" }}>
            <div style={S.statIcon}>🤝</div>
            <div style={{ ...S.statValue, color: "#4af0c8", fontSize: 18 }}>{topPartner.label}</div>
            <div style={S.statLabel}>Mejor pareja · {topPartner.winRate}% ({topPartner.wins}/{topPartner.played})</div>
          </div>
        )}
        {biggestWin && (
          <div style={{ ...S.statCard, borderColor: "#f04a4a44" }}>
            <div style={S.statIcon}>💥</div>
            <div style={{ ...S.statValue, fontSize: 22, color: "#f07a4a" }}>{biggestWin.score1} — {biggestWin.score2}</div>
            <div style={S.statLabel}>Partido más amplio · {biggestWin.team1.map(getPlayerName).join(" & ")} vs {biggestWin.team2.map(getPlayerName).join(" & ")}</div>
          </div>
        )}
        {longestMatch && (
          <div style={{ ...S.statCard, borderColor: "#4af0c844" }}>
            <div style={S.statIcon}>⏱</div>
            <div style={{ ...S.statValue, color: "#4af0c8" }}>
              {String(Math.floor(longestMatch.duration_seconds / 60)).padStart(2,"0")}:
              {String(longestMatch.duration_seconds % 60).padStart(2,"0")}
            </div>
            <div style={S.statLabel}>
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
    return <div style={S.empty}>No hay jornadas anteriores registradas.</div>;

  // Aggregate per player name
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
      <div style={S.statsGrid}>
        <div style={S.statCard}>
          <div style={S.statIcon}>📅</div>
          <div style={S.statValue}>{tournaments.length}</div>
          <div style={S.statLabel}>Jornadas jugadas</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statIcon}>🎾</div>
          <div style={S.statValue}>{totalMatches}</div>
          <div style={S.statLabel}>Partidos en total</div>
        </div>
        {rows[0] && (
          <div style={{ ...S.statCard, borderColor: "#e8f04a44" }}>
            <div style={S.statIcon}>👑</div>
            <div style={{ ...S.statValue, color: "#e8f04a" }}>{rows[0].name}</div>
            <div style={S.statLabel}>Mejor jugador histórico · {rows[0].pg}V</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ ...S.sectionTitle, fontSize: 13, marginBottom: 12 }}>RANKING HISTÓRICO</div>
        <PerPlayerTable standings={rows} showTourneys />
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ ...S.sectionTitle, fontSize: 13, marginBottom: 12 }}>JORNADAS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[...tournaments].reverse().map((t) => {
            const played = t.matches.filter((m) => m.score1 !== "").length;
            const winner = calcStandings(t.players, t.matches)[0];
            return (
              <div key={t.id} style={{ ...S.playerRow, flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16 }}>
                    {t.name}
                  </span>
                  {winner && <span style={{ color: "#e8f04a", fontSize: 13 }}>🏆 {winner.name}</span>}
                </div>
                <span style={{ color: "#555", fontSize: 11, fontFamily: "'Courier New', monospace" }}>
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
    <div style={{ marginTop: 16 }}>
      {!showTourneys && (
        <div style={{ ...S.sectionTitle, fontSize: 13, marginBottom: 12 }}>RENDIMIENTO POR JUGADOR</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {standings.map((p, i) => {
          const pct = p.pj > 0 ? Math.round((p.pg / p.pj) * 100) : 0;
          return (
            <div key={p.id ?? p.name} style={S.playerStatRow}>
              <div style={{ minWidth: 24, color: "#666", fontFamily: "'Courier New', monospace", fontWeight: 700 }}>{i + 1}</div>
              <div style={{ flex: 1, fontWeight: 600, color: "#fff" }}>{p.name}</div>
              {showTourneys && (
                <div style={{ minWidth: 50, color: "#555", fontSize: 11, fontFamily: "'Courier New', monospace" }}>
                  {p.torneos}J
                </div>
              )}
              <div style={{ flex: 2 }}>
                <div style={{ height: 8, background: "#1a1f2e", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.5s",
                    background: pct > 60 ? "#e8f04a" : pct > 40 ? "#4af0c8" : "#f04a4a" }} />
                </div>
              </div>
              <div style={{ minWidth: 80, textAlign: "right", fontFamily: "'Courier New', monospace", color: "#aaa", fontSize: 13 }}>
                {p.pg}G {p.pp}P <span style={{ color: pct >= 50 ? "#e8f04a" : "#f04a4a" }}>({pct}%)</span>
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
    <div style={{ marginTop: 24 }}>
      <div style={{ ...S.sectionTitle, fontSize: 13, marginBottom: 12 }}>PAREJAS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {partnerships.map((p, i) => (
          <div key={i} style={S.playerStatRow}>
            <div style={{ flex: 1, color: "#ccc", fontSize: 14 }}>{p.label}</div>
            <div style={{ flex: 2 }}>
              <div style={{ height: 6, background: "#1a1f2e", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${p.winRate}%`, height: "100%", background: "#4af0c8", borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ minWidth: 90, textAlign: "right", fontFamily: "'Courier New', monospace", color: "#aaa", fontSize: 13 }}>
              {p.wins}G {p.played - p.wins}P <span style={{ color: "#4af0c8" }}>({p.winRate}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}