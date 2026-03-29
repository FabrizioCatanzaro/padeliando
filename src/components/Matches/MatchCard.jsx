import { Clock, Pencil, Trash2 } from "lucide-react";
import { fmt, getPairLabel } from "../../utils/helpers";
export default function MatchCard({ match, tournament, isOwner, onEdit, onDelete, matchNum }) {
  const { team1, team2, score1, score2, date, createdAt } = match;
  const { players, pairs, mode } = tournament;
  const win1 = parseInt(score1) > parseInt(score2);

  function getLabel(team) {
    if (mode === "pairs") {
      const pair = pairs?.find(
        (p) => (p.p1 === team[0] && p.p2 === team[1]) || (p.p1 === team[1] && p.p2 === team[0])
      );
      if (pair) return getPairLabel(pair.id, pairs, players);
    }
    return team.map((id) => players.find((p) => p.id === id)?.name ?? "?").join(" & ");
  }

  return (
    <div className="bg-surface border border-border-mid rounded-lg px-4 py-3.5">
      <div className="text-xs text-muted font-mono mb-2.5">
        {matchNum != null && <span className="mr-1.5">#{matchNum} ·</span>}{fmt(date || createdAt)}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`flex-1 flex items-center gap-2 font-condensed font-semibold text-xl ${win1 ? "text-brand" : "text-secondary"}`}>
          {getLabel(team1)}
        </div>
        <div className="flex items-center gap-2 font-condensed font-black text-[28px] min-w-20 justify-center">
          <span className={win1 ? "text-brand" : "text-secondary"}>{score1}</span>
          <span className="text-border-strong text-[20px]">—</span>
          <span className={!win1 ? "text-cyan" : "text-secondary"}>{score2}</span>
        </div>
        <div className={`flex-1 flex items-center gap-2 font-condensed font-semibold text-xl justify-end text-right ${!win1 ? "text-cyan" : "text-secondary"}`}>
          {getLabel(team2)}
        </div>
      </div>
      {match.duration_seconds > 0 && (
        <div className="flex flex-row gap-3 items-center justify-center text-xs text-muted font-mono mt-1 text-center">
          <Clock size={12} /> 
          <span>{String(Math.floor(match.duration_seconds / 60)).padStart(2,"0")}:{String(match.duration_seconds % 60).padStart(2,"0")} min</span>
        </div>
      )}
      {isOwner && (
        <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-border-mid">
          <div onClick={onEdit}   className="flex flex-row gap-2 items-center bg-transparent border-0 text-muted cursor-pointer text-[12px] font-sans px-1.5 py-0.5">
            <Pencil size={15} />
            <span>Editar</span>
          </div>
          <div onClick={onDelete} className="flex flex-row gap-2 items-center bg-transparent border-0 text-danger cursor-pointer text-[12px] font-sans px-1.5 py-0.5">
            <Trash2 size={15} />
            <span>Eliminar</span>
          </div>
        </div>
      )}
    </div>
  );
}
