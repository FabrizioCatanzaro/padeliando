import { Medal, Trophy } from "lucide-react";
import { calcStandings } from "../../utils/helpers";
import PlayerAvatar, { PairAvatar } from "../shared/PlayerAvatar";

export default function Standings({ tournament }) {
  const individualRows = calcStandings(tournament.players, tournament.matches);
  const isPairs        = tournament.mode === "pairs";
  const hasPairs       = isPairs && tournament.pairs?.length > 0;

  const avatarById = Object.fromEntries(
    tournament.players.map((p) => [p.id, p.linked_avatar_url ?? null])
  );

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
      return {
        ...stats, id: pair.id, name: `${p1Name} & ${p2Name}`, p1Name, p2Name,
        src1: avatarById[pair.p1] ?? null,
        src2: avatarById[pair.p2] ?? null,
      };
    }).sort((a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc));
  } else {
    displayRows = individualRows.map((r) => ({ ...r, src: avatarById[r.id] ?? null }));
  }

  // ── Destacar la primera posición solo si no hay empate ─────────────────
  const topPg   = displayRows[0]?.pg ?? 0;
  const topDiff = displayRows[0] ? displayRows[0].sf - displayRows[0].sc : 0;
  const hasTie  = displayRows.filter(
    (r) => r.pg === topPg && (r.sf - r.sc) === topDiff
  ).length > 1;
  const isTop = (r) => !hasTie && topPg > 0 && r.id === displayRows[0]?.id;

  const champions = tournament.status === 'finished' && topPg > 0
    ? displayRows.filter((r) => r.pg === topPg && (r.sf - r.sc) === topDiff)
    : [];
  const championsCount = hasPairs ? champions.length * 2 : champions.length;
  const championsLabel = championsCount > 1 ? "CAMPEONES" : "CAMPEÓN";

  return (
    <div>
      {champions.length > 0 && (
        <div className="relative mb-6 overflow-hidden rounded-lg border border-amber-400/40 bg-gradient-to-b from-amber-400/15 via-amber-400/5 to-transparent p-6 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <Trophy size={36} className="mx-auto mb-2 text-amber-400" />
          <div className="font-mono text-[10px] tracking-[4px] text-amber-400/70 mb-1.5">{championsLabel}</div>
          <div className="flex flex-col items-center gap-3">
            {champions.map((c) => (
              <div key={c.id} className="flex flex-col items-center gap-2">
                {c.p1Name
                  ? <PairAvatar name1={c.p1Name} name2={c.p2Name} src1={c.src1} src2={c.src2} size={56} />
                  : <PlayerAvatar name={c.name} src={c.src} size={56} />
                }
                <div className="font-condensed font-black text-[24px] text-white leading-tight">
                  {c.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
              <th className="px-3 py-2.5 text-center text-[11px] tracking-[2px] text-muted border-b border-border font-mono">PTS</th>
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
                    { i + 1}
                  </td>
                  <td className={`p-3 text-left text-[15px] font-semibold ${top ? "text-brand" : "text-white"}`}>
                    <div className="flex items-center gap-2">
                      {r.p1Name
                        ? <PairAvatar name1={r.p1Name} name2={r.p2Name} src1={r.src1} src2={r.src2} size={26} />
                        : <PlayerAvatar name={r.name} src={r.src} size={26} />
                      }
                      {r.name}
                    </div>
                  </td>
                  <td className="p-3 text-center text-[15px] text-secondary">{r.pj}</td>
                  <td className="p-3 text-center text-[17px] text-brand">{r.pg * 3}</td>
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
        PJ: Partidos Jugados · PTS: Puntos (3 por victoria) · GF: Games a Favor ·
        GC: Games en Contra · DIF: Diferencia
      </div>
    </div>
  );
}
