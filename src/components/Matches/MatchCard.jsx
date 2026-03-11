import S from "../../styles/theme";
import { fmt, getPairLabel } from "../../utils/helpers";

export default function MatchCard({ match, tournament, onEdit, onDelete }) {
  const { team1, team2, score1, score2, date, createdAt } = match;
  const { players, pairs, mode } = tournament;
  const win1 = parseInt(score1) > parseInt(score2);

  function getLabel(team) {
    if (mode === "pairs") {
      // team is stored as [p1Id, p2Id]; find the matching pair by those IDs
      const pair = pairs?.find(
        (p) => (p.p1 === team[0] && p.p2 === team[1]) || (p.p1 === team[1] && p.p2 === team[0])
      );
      if (pair) return getPairLabel(pair.id, pairs, players);
    }
    return team.map((id) => players.find((p) => p.id === id)?.name ?? "?").join(" & ");
  }

  return (
    <div style={S.matchCard}>
      <div style={S.matchDate}>{fmt(date || createdAt)}</div>
      <div style={S.matchRow}>
        <div style={{ ...S.matchTeam, color: win1 ? "#e8f04a" : "#888" }}>
          <span style={S.teamBadge}>{mode === "pairs" ? "P1" : "E1"}</span>
          {getLabel(team1)}
        </div>
        <div style={S.matchScore}>
          <span style={{ color: win1 ? "#e8f04a" : "#888" }}>{score1}</span>
          <span style={S.scoreDash}>—</span>
          <span style={{ color: !win1 ? "#4af0c8" : "#888" }}>{score2}</span>
        </div>
        <div style={{ ...S.matchTeam, ...S.matchTeamRight, color: !win1 ? "#4af0c8" : "#888" }}>
          {getLabel(team2)}
          <span style={{ ...S.teamBadge, background: "#1a2a3a" }}>{mode === "pairs" ? "P2" : "E2"}</span>
        </div>
      </div>
      <div style={S.matchActions}>
        <button onClick={onEdit}   style={S.actionBtn}>✏️ Editar</button>
        <button onClick={onDelete} style={{ ...S.actionBtn, color: "#f04a4a" }}>🗑️ Eliminar</button>
      </div>
    </div>
  );
}