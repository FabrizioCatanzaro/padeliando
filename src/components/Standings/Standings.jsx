import { Trophy } from "lucide-react";
import { calcStandings } from "../../utils/helpers";
import PlayerAvatar, { PairAvatar } from "../shared/PlayerAvatar";

function calcForm(playerIds, matches) {
  const ids = playerIds.map(String).filter(id => id && id !== 'null');
  if (!ids.length) return [];
  const played = matches
    .filter(m => m.score1 !== "" && m.score2 !== "")
    .filter(m => {
      const t1 = (m.team1 ?? []).map(String).filter(id => id && id !== 'null');
      const t2 = (m.team2 ?? []).map(String).filter(id => id && id !== 'null');
      if (ids.length > 1) {
        return ids.every(id => t1.includes(id)) || ids.every(id => t2.includes(id));
      }
      return [...t1, ...t2].some(id => ids.includes(id));
    });
  // API devuelve ORDER BY created_at DESC; slice(0,3) = los 3 más recientes, reverse = orden cron.
  const last3 = played.slice(0, 3).reverse();
  return last3.map(m => {
    const t1 = (m.team1 ?? []).map(String);
    const inTeam1 = ids.some(id => t1.includes(id));
    const win = inTeam1 ? parseInt(m.score1) > parseInt(m.score2) : parseInt(m.score2) > parseInt(m.score1);
    return win ? 'W' : 'L';
  });
}

function FormDots({ form }) {
  return (
    <div className="flex gap-1 justify-center">
      {Array.from({ length: 3 }).map((_, i) => {
        const r = form[i];
        return (
          <div
            key={i}
            title={r === 'W' ? 'Victoria' : r === 'L' ? 'Derrota' : '–'}
            className={`w-2 h-2 rounded-full transition-colors ${
              r === 'W' ? 'bg-green' : r === 'L' ? 'bg-danger' : 'bg-border-strong'
            }`}
          />
        );
      })}
    </div>
  );
}

const POS_COLOR = ['text-amber-400', 'text-[#b0b8c8]', 'text-[#cd7f32]'];

export default function Standings({ tournament }) {
  const individualRows = calcStandings(tournament.players, tournament.matches);
  const isPairs        = tournament.mode === "pairs";
  const hasPairs       = isPairs && tournament.pairs?.length > 0;

  const playerById = Object.fromEntries(tournament.players.map((p) => [String(p.id), p]));

  let displayRows;
  if (hasPairs) {
    displayRows = tournament.pairs.map((pair) => {
      const stats = individualRows.find((r) => r.id === pair.p1)
                 ?? individualRows.find((r) => r.id === pair.p2)
                 ?? { pj: 0, pg: 0, pp: 0, sf: 0, sc: 0 };
      const p1 = playerById[String(pair.p1)];
      const p2 = playerById[String(pair.p2)];
      return {
        ...stats, id: pair.id,
        name: `${p1?.name ?? "?"} & ${p2?.name ?? "?"}`,
        p1Name: p1?.name ?? "?", p2Name: p2?.name ?? "?",
        src1: p1?.linked_avatar_url ?? null,
        src2: p2?.linked_avatar_url ?? null,
        playerIds: [pair.p1, pair.p2],
      };
    }).sort((a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc));
  } else {
    displayRows = individualRows.map((r) => {
      const p = playerById[String(r.id)];
      return { ...r, src: p?.linked_avatar_url ?? null, is_premium: p?.is_premium ?? false, playerIds: [r.id] };
    });
  }

  const topPg   = displayRows[0]?.pg ?? 0;
  const topDiff = displayRows[0] ? displayRows[0].sf - displayRows[0].sc : 0;
  const hasTie  = displayRows.filter(r => r.pg === topPg && (r.sf - r.sc) === topDiff).length > 1;
  const isTop   = (r) => !hasTie && topPg > 0 && r.id === displayRows[0]?.id;

  const champions = tournament.status === 'finished' && topPg > 0 && tournament.format !== 'americano'
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
                  : <PlayerAvatar name={c.name} src={c.src} size={56} premium={!!(playerById[String(c.id)]?.is_premium)} />
                }
                <div className="font-condensed font-black text-[24px] text-white leading-tight">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-4">TABLA DE POSICIONES</div>

      <div className="rounded-lg border border-border">
        <table className="w-full table-fixed border-collapse font-condensed">
          <thead>
            <tr className="bg-surface">
              <th className="px-2 py-2.5 text-center text-[10px] tracking-[2px] text-dim border-b border-border font-mono w-8">#</th>
              <th className="px-2 py-2.5 text-left text-[10px] tracking-[2px] text-dim border-b border-border font-mono">
                {hasPairs ? "PAREJA" : "JUGADOR"}
              </th>
              <th className="px-2 py-2.5 text-center text-[10px] tracking-[2px] text-dim border-b border-border font-mono w-10">PTS</th>
              <th className="px-2 py-2.5 text-center text-[10px] tracking-[2px] text-dim border-b border-border font-mono w-9">PJ</th>
              <th className="px-2 py-2.5 text-center text-[10px] tracking-[2px] text-dim border-b border-border font-mono w-9">PG</th>
              <th className="hidden sm:table-cell px-2 py-2.5 text-center text-[10px] tracking-[2px] text-dim border-b border-border font-mono w-10">GF</th>
              <th className="hidden sm:table-cell px-2 py-2.5 text-center text-[10px] tracking-[2px] text-dim border-b border-border font-mono w-10">GC</th>
              <th className="px-2 py-2.5 text-center text-[10px] tracking-[2px] text-dim border-b border-border font-mono w-11">DIF</th>
              <th className="px-2 py-2.5 text-center text-[10px] tracking-[2px] text-dim border-b border-border font-mono w-14">FORMA</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r, i) => {
              const top  = isTop(r);
              const form = calcForm(r.playerIds, tournament.matches);
              const rowBg = top
                ? "bg-gradient-to-r from-brand/10 to-transparent border-l-2 border-l-brand"
                : i % 2 === 0 ? "bg-surface/50" : "bg-base";
              return (
                <tr key={r.id} className={`${rowBg} transition-colors`}>
                  <td className="px-2 py-3 text-center">
                    {top ? (
                      <Trophy size={14} className="text-amber-400 mx-auto" />
                    ) : (
                      <span className={`font-mono text-[13px] font-bold ${POS_COLOR[i] ?? 'text-dim'}`}>
                        {i + 1}
                      </span>
                    )}
                  </td>
                  <td className={`px-2 py-3 text-left text-[18px] font-semibold ${top ? "text-brand" : "text-white"}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="shrink-0">
                        {r.p1Name
                          ? <PairAvatar name1={r.p1Name} name2={r.p2Name} src1={r.src1} src2={r.src2} size={22} />
                          : <PlayerAvatar name={r.name} src={r.src} size={22} premium={!!(playerById[String(r.id)]?.is_premium)} />
                        }
                      </div>
                      <span className="line-clamp-2 leading-tight">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center text-[15px] font-bold text-brand">{r.pg * 3}</td>
                  <td className="px-2 py-3 text-center text-[13px] text-secondary">{r.pj}</td>
                  <td className="px-2 py-3 text-center text-[13px] text-secondary">{r.pg}</td>
                  <td className="hidden sm:table-cell px-2 py-3 text-center text-[13px] text-secondary">{r.sf}</td>
                  <td className="hidden sm:table-cell px-2 py-3 text-center text-[13px] text-secondary">{r.sc}</td>
                  <td className={`px-2 py-3 text-center text-[13px] font-bold ${r.sf - r.sc >= 0 ? "text-green" : "text-danger"}`}>
                    {r.sf - r.sc > 0 ? "+" : ""}{r.sf - r.sc}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <FormDots form={form} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[10px] text-dim font-mono leading-relaxed">
        PTS: 3 por victoria · PG: victorias · PJ: partidos jugados · DIF: diferencia de games · FORMA: últimos 3
      </div>
    </div>
  );
}
