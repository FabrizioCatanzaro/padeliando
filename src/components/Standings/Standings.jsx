import { Medal } from "lucide-react";
import { calcStandings } from "../../utils/helpers";

export default function Standings({ tournament }) {
  const rows = calcStandings(tournament.players, tournament.matches);

  return (
    <div>
      <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-4">TABLA DE POSICIONES</div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-condensed">
          <thead>
            <tr>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">#</th>
              <th className="px-3 py-2.5 text-left text-[11px] tracking-[2px] text-muted border-b border-border font-mono">JUGADOR</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">PJ</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">PG</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">PP</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">GF</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">GC</th>
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">DIF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? "bg-surface" : "bg-base"}>
                <td className={`p-3 text-center text-[18px] flex justify-center items-center ${i === 0 ? "text-brand" : i === 1 ? "text-soft" : i === 2 ? "text-[#cd7f32]" : "text-muted"}`}>
                  {i === 0 ? <Medal className="text-brand" size={18}/> : i === 1 ? <Medal className="text-soft" size={18}/> : i === 2 ? <Medal className="text-[#cd7f32]" size={18}/> : i + 1}
                </td>
                <td className="p-3 text-left text-[15px] font-semibold text-white">{r.name}</td>
                <td className="p-3 text-center text-[15px] text-secondary">{r.pj}</td>
                <td className="p-3 text-center text-[15px] text-brand font-bold">{r.pg}</td>
                <td className="p-3 text-center text-[15px] text-danger">{r.pp}</td>
                <td className="p-3 text-center text-[15px] text-secondary">{r.sf}</td>
                <td className="p-3 text-center text-[15px] text-secondary">{r.sc}</td>
                <td className={`p-3 text-center text-[15px] font-bold ${r.sf - r.sc >= 0 ? "text-green" : "text-danger"}`}>
                  {r.sf - r.sc > 0 ? "+" : ""}{r.sf - r.sc}
                </td>
              </tr>
            ))}
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
