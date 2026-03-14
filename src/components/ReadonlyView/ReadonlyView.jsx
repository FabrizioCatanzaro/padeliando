import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fmt } from "../../utils/helpers";
import Loader from "../Loader/Loader";
import Standings from "../Standings/Standings";
import Stats from "../Stats/Stats";
import MatchCard from "../Matches/MatchCard";
import { api } from '../../utils/api';
import { adaptTournament } from '../../utils/helpers';

const TABS = [
  { id: "standings", label: "TABLA",        icon: "🏆" },
  { id: "matches",   label: "PARTIDOS",     icon: "🎾" },
  { id: "players",   label: "JUGADORES",    icon: "👤" },
  { id: "stats",     label: "ESTADÍSTICAS", icon: "📊" },
];

export default function ReadonlyView() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [error, setError]           = useState(false);
  const [tab, setTab]               = useState("standings");

  useEffect(() => {
    async function load() {
      try {
        const t = await api.readonly.get(id);
        setTournament(adaptTournament(t));
      } catch {
        setError(true);
      }
    }

    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-base text-content font-sans pb-15 flex items-center justify-center">
        <div className="text-center text-[#666]">
          <div className="text-[48px] mb-3">🔍</div>
          <div className="text-soft font-mono">Torneo no encontrado.</div>
          <div className="text-muted text-[13px] mt-2">El link puede haber expirado o ser inválido.</div>
        </div>
      </div>
    );
  }

  if (!tournament) return <Loader />;

  const playedCount = tournament.matches.filter((m) => m.score1 !== "").length;

  return (
    <div className="min-h-screen bg-base text-content font-sans pb-15">
      <div className="px-6 pt-6 pb-5 flex justify-between items-start flex-wrap gap-3 border-b border-border">
        <div>
          <div className="font-condensed font-bold text-[28px] text-white tracking-wide">{tournament.name}</div>
          <div className="text-[11px] text-muted font-mono mt-1">
            Creado el {fmt(tournament.createdAt)} · {tournament.players.length} jugadores
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="bg-surface text-cyan border border-cyan/27 px-3 py-1.5 font-condensed font-bold tracking-wide text-[12px] rounded-sm">
            👁 SOLO LECTURA
          </div>
          <div className="text-dim text-[11px] font-mono">
            {playedCount} partidos jugados · actualiza cada 30s
          </div>
        </div>
      </div>

      <div className="flex border-b border-border px-4 items-center overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`bg-transparent border-0 px-3.5 py-3.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer border-b-2 whitespace-nowrap transition-all ${tab === t.id ? 'text-brand border-b-brand' : 'text-muted border-b-transparent'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === "standings" && <Standings tournament={tournament} />}
        {tab === "stats"     && <Stats     tournament={tournament} />}
        {tab === "matches"   && <ReadonlyMatches tournament={tournament} />}
        {tab === "players"   && <ReadonlyPlayers tournament={tournament} />}
      </div>
    </div>
  );
}

function ReadonlyMatches({ tournament }) {
  const played = tournament.matches.filter((m) => m.score1 !== "" && m.score2 !== "");
  if (played.length === 0)
    return <div className="text-center text-dim py-10 font-sans">No hay partidos jugados todavía.</div>;
  return (
    <div className="flex flex-col gap-2.5">
      {played.map((m) => (
        <MatchCard key={m.id} match={m} tournament={tournament} isOwner={false} />
      ))}
    </div>
  );
}

function ReadonlyPlayers({ tournament }) {
  const { players, pairs, mode } = tournament;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-3">JUGADORES</div>
        {players.length === 0
          ? <div className="text-dim font-sans text-sm">No hay jugadores registrados.</div>
          : (
            <div className="flex flex-col gap-2">
              {players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 bg-surface border border-border-mid rounded-md px-3.5 py-2.5">
                  <div className="min-w-6 text-muted font-mono font-bold text-[13px]">{i + 1}</div>
                  <div className="text-white font-semibold">{p.name}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {mode === "pairs" && pairs.length > 0 && (
        <div>
          <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-3">PAREJAS</div>
          <div className="flex flex-col gap-2">
            {pairs.map((pair, i) => {
              const p1 = players.find((p) => p.id === pair.p1)?.name ?? "?";
              const p2 = players.find((p) => p.id === pair.p2)?.name ?? "?";
              return (
                <div key={pair.id} className="flex items-center gap-3 bg-surface border border-border-mid rounded-md px-3.5 py-2.5">
                  <div className="min-w-6 text-muted font-mono font-bold text-[13px]">{i + 1}</div>
                  <div className="text-white font-semibold">{p1} <span className="text-muted">&</span> {p2}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
