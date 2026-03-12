import { useState } from "react";
import S, { FONTS } from "../../styles/theme";
import { fmt } from "../../utils/helpers";
import Standings    from "../Standings/Standings";
import Matches      from "../Matches/Matches";
import Stats        from "../Stats/Stats";
import Management   from "../Management/Management";

const TABS = [
  { id: "standings",  label: "TABLA",         icon: "🏆" },
  { id: "matches",    label: "PARTIDOS",       icon: "🎾" },
  { id: "stats",      label: "ESTADÍSTICAS",   icon: "📊" },
  { id: "management", label: "GESTIÓN",        icon: "⚙️" },
];

export default function Main({
  tournament, onAddMatch, onEditMatch, onDeleteMatch,
  onAddPlayer, onEditPlayer, onDeletePlayer,
  onAddPair, onEditPair, onDeletePair,
  onResetScores, onReset,
  shareLink, saved, onToggleStatus
}) {
  //console.log("PLAYERS MAP",tournament.players.map(p => p.id))
  //console.log("MATCHES",tournament.matches[0]?.team1)
  const [tab, setTab]       = useState("standings");
  const [copied, setCopied] = useState(false);

  const playedCount = tournament.matches.filter((m) => m.score1 !== "").length;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={S.page}>
      <style>{FONTS}</style>

      <div style={S.header}>
        <div>
          <div style={{...S.logo, cursor: "pointer"}} onClick={() => { window.location.hash = "/"; }} >🎾 PADEL<span style={{ color: "#e8f04a" }}>EANDO</span></div>
          <div style={S.tourneyName}>{tournament.name}</div>
          <span style={{
            fontSize: 11, fontFamily: "'Courier New', monospace",
            color: tournament.status === 'active' ? '#4af07a' : '#555',
            marginLeft: 10,
          }}>
            {tournament.status === 'active' ? '● EN CURSO' : '■ FINALIZADA'}
          </span>
          <div style={S.meta}>
            Creado el {fmt(tournament.createdAt)} · {tournament.players.length} jugadores ·{" "}
            {playedCount} partidos ·{" "}
            <span style={{ color: tournament.mode === "pairs" ? "#4af0c8" : "#e8f04a" }}>
              {tournament.mode === "pairs" ? "parejas fijas" : "equipos libres"}
            </span>
          </div>
        </div>
        <button onClick={copyLink} style={S.shareBtn}>
          {copied ? "✓ COPIADO" : "🔗 COMPARTIR"}
        </button>
      </div>

      {saved && <div style={S.savedBadge}>✓ Guardado</div>}

      <div style={S.tabs}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={S.content}>
        {tab === "standings"  && <Standings  tournament={tournament} />}
        {tab === "matches"    && <Matches    tournament={tournament} onAddMatch={onAddMatch} onEditMatch={onEditMatch} onDeleteMatch={onDeleteMatch} />}
        {tab === "stats"      && <Stats      tournament={tournament} />}
        {tab === "management" && (
          <Management
            tournament={tournament}
            onAddPlayer={onAddPlayer}
            onEditPlayer={onEditPlayer}
            onDeletePlayer={onDeletePlayer}
            onAddPair={onAddPair}
            onEditPair={onEditPair}
            onDeletePair={onDeletePair}
            onResetScores={onResetScores}
            onDeleteTournament={onReset}
            onToggleStatus={onToggleStatus}
          />
        )}
      </div>
    </div>
  );
}