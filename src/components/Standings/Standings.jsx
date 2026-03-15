import { Medal } from "lucide-react";
import { calcStandings } from "../../utils/helpers";

export default function Standings({ tournament }) {
  const individualRows = calcStandings(tournament.players, tournament.matches);
  const isPairs        = tournament.mode === "pairs";
  const hasPairs       = isPairs && tournament.pairs?.length > 0;

  // ── Filas de la tabla: una por pareja (pairs) o una por jugador (free) ──
  let displayRows;
  if (hasPairs) {
    displayRows = tournament.pairs.map((pair) => {
      // Ambos jugadores tienen stats idénticas; tomamos el primero disponible.
      const stats = individualRows.find((r) => r.id === pair.p1)
                 ?? individualRows.find((r) => r.id === pair.p2)
                 ?? { pj: 0, pg: 0, pp: 0, sf: 0, sc: 0 };
      const p1Name = tournament.players.find((p) => p.id === pair.p1)?.name ?? "?";
      const p2Name = tournament.players.find((p) => p.id === pair.p2)?.name ?? "?";
      return { ...stats, id: pair.id, name: `${p1Name} & ${p2Name}` };
    }).sort((a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc));
  } else {
    displayRows = individualRows;
  }

  // ── Destacar la primera posición solo si no hay empate ─────────────────
  const topPg   = displayRows[0]?.pg ?? 0;
  const topDiff = displayRows[0] ? displayRows[0].sf - displayRows[0].sc : 0;
  const hasTie  = displayRows.filter(
    (r) => r.pg === topPg && (r.sf - r.sc) === topDiff
  ).length > 1;
  const isTop = (r) => !hasTie && topPg > 0 && r.id === displayRows[0]?.id;

  return (
    <div>
      <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-4">TABLA DE POSICIONES</div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-condensed">
          <thead>
            <tr>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">#</th>
              <th className="px-3 py-2.5 text-left text-[11px] tracking-[2px] text-muted border-b border-border font-mono">
                {hasPairs ? "PAREJA" : "JUGADOR"}
              </th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">PJ</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">PG</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">PP</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">GF</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">GC</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">DIF</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r, i) => {
              const top     = isTop(r);
              const baseRow = top
                ? "bg-brand/8 border-l-2 border-l-brand"
                : i % 2 === 0 ? "bg-surface" : "bg-base";
              return (
                <tr key={r.id} className={baseRow}>
                  <td className={`p-3 text-center text-[18px] flex justify-center items-center ${i === 0 ? "text-brand" : i === 1 ? "text-soft" : i === 2 ? "text-[#cd7f32]" : "text-muted"}`}>
                    {i === 0 ? <Medal className="text-brand" size={18}/> : i === 1 ? <Medal className="text-soft" size={18}/> : i === 2 ? <Medal className="text-[#cd7f32]" size={18}/> : i + 1}
                  </td>
                  <td className={`p-3 text-left text-[15px] font-semibold ${top ? "text-brand" : "text-white"}`}>{r.name}</td>
                  <td className="p-3 text-center text-[15px] text-secondary">{r.pj}</td>
                  <td className="p-3 text-center text-[15px] text-brand font-bold">{r.pg}</td>
                  <td className="p-3 text-center text-[15px] text-danger">{r.pp}</td>
                  <td className="p-3 text-center text-[15px] text-secondary">{r.sf}</td>
                  <td className="p-3 text-center text-[15px] text-secondary">{r.sc}</td>
                  <td className={`p-3 text-center text-[15px] font-bold ${r.sf - r.sc >= 0 ? "text-green" : "text-danger"}`}>
                    {r.sf - r.sc > 0 ? "+" : ""}{r.sf - r.sc}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-[11px] text-[#333] font-mono">
        PJ: Partidos Jugados · PG: Ganados · PP: Perdidos · GF: Games a Favor ·
        GC: Games en Contra
      </div>
    </div>
  );
}
