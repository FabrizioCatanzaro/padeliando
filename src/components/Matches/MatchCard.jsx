import { Clock, Pencil, Trash2 } from "lucide-react";
import { fmt, getPairLabel, setWinner, visibleSetsCount } from "../../utils/helpers";
export default function MatchCard({ match, tournament, isOwner, onEdit, onDelete, matchNum }) {
  const { team1, team2, score1, score2, date, createdAt, sets = [], sets_format } = match;
  const { players, pairs, mode } = tournament;

  // Para 1 set mostramos el score del set, no los sets ganados (que sería 1-0)
  const displayS1 = sets_format === 1 ? (sets[0]?.s1 ?? score1) : score1;
  const displayS2 = sets_format === 1 ? (sets[0]?.s2 ?? score2) : score2;
  const win1 = parseInt(displayS1) > parseInt(displayS2);
  const nVisible = sets_format === 3 ? visibleSetsCount(sets_format, sets) : 0;

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
        <div className="flex flex-col items-center gap-1 min-w-20 justify-center">
          <div className="flex items-center gap-2 font-condensed font-black text-[28px]">
            <span className={win1 ? "text-brand" : "text-secondary"}>{displayS1}</span>
            <span className="text-border-strong text-[20px]">—</span>
            <span className={!win1 ? "text-cyan" : "text-secondary"}>{displayS2}</span>
          </div>
          {nVisible > 0 && (
            <div className="flex gap-2 font-mono text-[11px] text-muted">
              {sets.slice(0, nVisible).map((s, i) => {
                const w = setWinner(s);
                return (
                  <span key={i}>
                    <span className={w === 1 ? "text-brand" : ""}>{s.s1}</span>
                    <span>-</span>
                    <span className={w === 2 ? "text-cyan" : ""}>{s.s2}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className={`flex-1 flex items-center gap-2 font-condensed font-semibold text-xl justify-end text-right ${!win1 ? "text-cyan" : "text-secondary"}`}>
          {getLabel(team2)}
        </div>
      </div>
        <div className="flex flex-row gap-3 items-center justify-center text-xs text-muted font-mono mt-1 text-center">
          <Clock size={12} /> 
          {match.duration_seconds != null ? (
            <span>{String(Math.floor(match.duration_seconds / 60)).padStart(2,"0")}:{String(match.duration_seconds % 60).padStart(2,"0")} min</span>
          ) : (
            <span>--:-- min</span>
          )}
        </div>
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
