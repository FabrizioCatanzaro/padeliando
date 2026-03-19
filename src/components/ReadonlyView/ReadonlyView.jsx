import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmt } from "../../utils/helpers";
import Standings from "../Standings/Standings";
import Stats from "../Stats/Stats";
import MatchCard from "../Matches/MatchCard";
import { api } from '../../utils/api';
import { adaptTournament } from '../../utils/helpers';
import { ChartNoAxesCombined, ChevronLeft, Eye, Flame, Trophy, User, Zap } from "lucide-react";
import Loader from "../Loader/Loader";

const TABS = [
  { id: "standings", label: "TABLA",        icon: Trophy },
  { id: "matches",   label: "PARTIDOS",     icon: Flame},
  { id: "players",   label: "JUGADORES",    icon: User },
  { id: "stats",     label: "ESTADÍSTICAS", icon: ChartNoAxesCombined },
];

export default function ReadonlyView() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      <div className="bg-base text-content font-sans pb-15 flex items-center justify-center">
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
  const playedStatus = playedCount === 0 ? 'Sin partidos aún' : `${playedCount} ${playedCount === 1 ? ' partido jugado' : ' partidos jugados'}`;

  return (
    <div className="bg-base text-content font-sans pb-15">
      <div className="px-6 pt-6 pb-5 flex justify-between items-start flex-wrap gap-3 border-b border-border">
        <div>
          {window.history.length > 1 && (
            <div onClick={() => navigate(-1)} className="flex flex-row gap-2 items-center w-fit bg-transparent text-muted border border-border-strong px-3 py-1.5 text-[12px] cursor-pointer rounded-sm font-sans mb-3">
              <ChevronLeft size={15} />
              <span>Volver</span>
            </div>
          )}
          <div className="font-condensed font-bold text-4xl text-white tracking-wide">{tournament.name}</div>
          <span className={`text-xs font-mono mt-0.5 ${tournament.status === 'active' ? 'text-green' : 'text-muted'}`}>
            {tournament.status === 'active' ? '● EN CURSO' : '■ FINALIZADA'}
          </span>
          <div className="text-sm text-muted font-mono mt-1">
            Creado el {fmt(tournament.createdAt)}
            {tournament.owner_username && (
              <> por <span
                className="text-soft hover:text-white underline cursor-pointer"
                onClick={() => navigate(`/u/${tournament.owner_username}`)}
              >@{tournament.owner_username}</span></>
            )} · {tournament.players.length} jugadores
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="text-muted text-sm font-mono">
            {playedStatus} · actualiza cada 30s
          </div>
          <div className="flex flex-row gap-2 items-center bg-surface text-cyan border border-cyan/27 px-3 py-1.5 font-condensed font-bold tracking-wide text-sm mt-2 rounded-sm">
            <Eye size={15} />
            <span>SOLO LECTURA</span>
          </div>
        </div>
      </div>

      {Array.isArray(tournament.live_match) && tournament.live_match.length > 0 && (
        <div className="border-b border-brand/30">
          {tournament.live_match.map((m, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-2.5 bg-brand/10">
              <Zap size={13} className="text-brand shrink-0" />
              <span className="font-condensed font-bold text-[12px] tracking-wide text-brand whitespace-nowrap">EN VIVO</span>
              <span className="text-soft font-sans text-[13px]">
                {m.team1Label} <span className="text-muted">vs</span> {m.team2Label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex border-b border-border px-4 items-center overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-row gap-2 items-center bg-transparent border-0 px-3.5 py-3.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer border-b-2 whitespace-nowrap transition-all hover:text-brand ${tab === t.id ? 'text-brand border-b-brand' : 'text-muted border-b-transparent'}`}>
            <t.icon size={15}/>{t.label}
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
