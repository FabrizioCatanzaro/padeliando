import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmt, calcStandings } from "../../utils/helpers";
import Standings from "../Standings/Standings";
import Stats from "../Stats/Stats";
import MatchCard from "../Matches/MatchCard";
import Bracket from "../Americano/Bracket";
import PhotoGallery from "../Photos/PhotoGallery";
import PlayerAvatar, { PairAvatar } from "../shared/PlayerAvatar";
import { api } from '../../utils/api';
import { adaptTournament } from '../../utils/helpers';
import { ChartNoAxesCombined, Check, ChevronLeft, Eye, Flame, Share2, Split, List, Trophy, User, Zap } from "lucide-react";
import Loader from "../Loader/Loader";

const LIGA_TABS = [
  { id: "standings", label: "TABLA",        icon: Trophy },
  { id: "matches",   label: "PARTIDOS",     icon: Flame },
  { id: "players",   label: "JUGADORES",    icon: User },
  { id: "stats",     label: "ESTADÍSTICAS", icon: ChartNoAxesCombined },
];

const AMERICANO_TABS = [
  { id: "standings", label: "TABLA",      icon: Trophy },
  { id: "matches",   label: "PREVIA",     icon: List },
  { id: "bracket",   label: "CUADRO",     icon: Split },
  { id: "stats",     label: "ESTADÍSTICAS", icon: ChartNoAxesCombined },
  { id: "players",   label: "JUGADORES",  icon: User },
];

export default function ReadonlyView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [groupName, setGroupName]     = useState(null);
  const [groupEmojis, setGroupEmojis] = useState([]);
  const [error, setError]           = useState(false);
  const [tab, setTab]               = useState("standings");
  const [copied, setCopied]         = useState(false);

  async function copyLink() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament?.name ?? 'Jornada',
          text: `¡Te invito a ver "${tournament?.name ?? 'esta jornada'}"! Seguí los resultados en vivo acá:`,
          url,
        });
      } catch { /* usuario canceló */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const t = await api.readonly.get(id);
        setTournament(adaptTournament(t));
        if (t.group_id) {
          const g = await api.groups.get(t.group_id);
          setGroupName(g.name);
          setGroupEmojis(g.emojis ?? []);
        }
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

  const isAmericano = tournament.format === 'americano';
  const TABS = isAmericano ? AMERICANO_TABS : LIGA_TABS;

  let winnerLabel = null;
  if (tournament.status === 'finished') {
    if (isAmericano) {
      if (tournament.bracket?.final?.winner_name) winnerLabel = tournament.bracket.final.winner_name;
    } else {
      const standings = calcStandings(tournament.players, tournament.matches);
      if (tournament.mode === 'pairs' && tournament.pairs?.length > 0) {
        const pairRows = tournament.pairs.map((pair) => {
          const stats  = standings.find((r) => r.id === pair.p1) ?? standings.find((r) => r.id === pair.p2) ?? { pj: 0, pg: 0, sf: 0, sc: 0 };
          const p1Name = tournament.players.find((p) => p.id === pair.p1)?.name ?? '?';
          const p2Name = tournament.players.find((p) => p.id === pair.p2)?.name ?? '?';
          return { ...stats, id: pair.id, name: `${p1Name} & ${p2Name}` };
        }).sort((a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc));
        const topPg   = pairRows[0]?.pg ?? 0;
        const topDiff = pairRows[0] ? pairRows[0].sf - pairRows[0].sc : 0;
        const top     = pairRows.filter((r) => r.pj > 0 && r.pg === topPg && (r.sf - r.sc) === topDiff);
        if (top.length) winnerLabel = top.map((r) => r.name).join(' / ');
      } else {
        const topPg   = standings[0]?.pg ?? 0;
        const topDiff = standings[0] ? standings[0].sf - standings[0].sc : 0;
        const top     = standings.filter((r) => r.pj > 0 && r.pg === topPg && (r.sf - r.sc) === topDiff);
        if (top.length) winnerLabel = top.map((r) => r.name).join(' / ');
      }
    }
  }

  const bracketPlayed = isAmericano
    ? [...(tournament.bracket?.octavos ?? []), ...(tournament.bracket?.cuartos ?? []),
       ...(tournament.bracket?.semis   ?? []), ...(tournament.bracket?.final ? [tournament.bracket.final] : [])]
      .filter(m => m.winner_id != null).length
    : 0;
  const playedCount = tournament.matches.filter((m) => m.score1 !== "").length + bracketPlayed;

  return (
    <div className="bg-base text-content font-sans pb-15">
      <div className="px-6 pt-5 pb-5 border-b border-border bg-gradient-to-b from-surface/25 to-transparent">
        {/* Breadcrumbs + compartir */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {window.history.length > 1 && (
              <div
                onClick={() => navigate(-1)}
                className="flex flex-row gap-1.5 items-center text-muted border border-border-strong px-2.5 py-1 text-[11px] cursor-pointer rounded-sm font-sans hover:text-white transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Volver</span>
              </div>
            )}
            {groupName && (
              <div
                onClick={() => navigate(`/groups/${tournament.group_id}`)}
                className="inline-flex items-center gap-1.5 bg-surface border border-border-mid rounded-full px-3 py-1 cursor-pointer hover:border-border-strong transition-colors"
              >
                {groupEmojis?.length > 0 && (
                  <span className="text-sm leading-none">{groupEmojis.join(' ')}</span>
                )}
                <span className="text-[11px] font-mono text-muted">{groupName}</span>
              </div>
            )}
          </div>
          <div
            onClick={copyLink}
            className="bg-brand text-base border-0 px-4 py-2 font-condensed font-bold tracking-wide text-[13px] cursor-pointer rounded-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>COPIADO!</span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                <span>COMPARTIR</span>
              </>
            )}
          </div>
        </div>

        {/* Título */}
        <h1 className="font-condensed font-bold text-[32px] text-white tracking-wide leading-tight mb-2">
          {tournament.name}
        </h1>

        {/* Estado + ganador */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <span className={`text-[11px] font-mono ${tournament.status === 'active' ? 'text-green' : 'text-muted'}`}>
            {tournament.status === 'active' ? '● EN CURSO' : '■ FINALIZADA'}
          </span>
          {winnerLabel && (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-brand font-mono">
              <Trophy size={13} /> {winnerLabel}
            </span>
          )}
        </div>

        {/* Chips con datos de la jornada */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="inline-flex items-center bg-surface border border-border-mid rounded-full px-2.5 py-0.5 text-[11px] font-mono text-muted">
            {fmt(tournament.createdAt)}
          </span>
          <span className="inline-flex items-center bg-surface border border-border-mid rounded-full px-2.5 py-0.5 text-[11px] font-mono text-muted">
            {isAmericano ? `${tournament.pairs.length} parejas` : `${tournament.players.length} jugadores`}
          </span>
          <span className="inline-flex items-center bg-surface border border-border-mid rounded-full px-2.5 py-0.5 text-[11px] font-mono text-muted">
            {playedCount} partidos
          </span>
          <span className="inline-flex items-center bg-surface border border-border-mid rounded-full px-2.5 py-0.5 text-[11px] font-mono">
            {isAmericano ? (
              <span className="text-brand">americano</span>
            ) : (
              <span className={tournament.mode === "pairs" ? "text-cyan" : "text-brand"}>
                {tournament.mode === "pairs" ? "parejas fijas" : "equipos libres"}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Barra discreta: vista de espectadores */}
      <div className="px-6 py-1.5 bg-cyan/5 border-b border-cyan/15 flex items-center gap-2 flex-wrap">
        <Eye size={11} className="text-cyan/70" />
        <span className="text-[11px] font-mono text-cyan/70">Vista de espectadores</span>
        <span className="text-cyan/30">·</span>
        <span className="text-[11px] font-mono text-cyan/50">actualiza cada 30s</span>
      </div>

      {Array.isArray(tournament.live_match) && tournament.live_match.length > 0 && (
        <div className="border-b border-brand/30">
          {tournament.live_match.map((m, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-2.5 bg-brand/10">
              <Zap size={13} className="text-brand shrink-0" />
              <span className="font-condensed font-bold text-[12px] tracking-wide text-brand whitespace-nowrap">EN VIVO</span>
              {isAmericano && m.phase && (
                <span className="font-condensed font-bold text-[11px] tracking-wide text-brand/60 whitespace-nowrap border border-brand/30 px-1.5 py-0.5 rounded-sm">
                  {{ previa: 'FASE PREVIA', octavos: 'OCTAVOS', cuartos: 'CUARTOS', semis: 'SEMIS', final: 'FINAL' }[m.phase] ?? m.phase.toUpperCase()}
                </span>
              )}
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
        {tab === "bracket"   && <Bracket tournament={tournament} isOwner={false} />}

        <PhotoGallery tournamentId={tournament.id} isOwner={false} canUpload={false} />
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
      {played.map((m, i) => (
        <MatchCard key={m.id} match={m} tournament={tournament} isOwner={false} matchNum={played.length - i} />
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
                  <PlayerAvatar name={p.name} src={p.linked_avatar_url ?? null} size={28} />
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
              const player1 = players.find((p) => p.id === pair.p1);
              const player2 = players.find((p) => p.id === pair.p2);
              const p1 = player1?.name ?? "?";
              const p2 = player2?.name ?? "?";
              return (
                <div key={pair.id} className="flex items-center gap-3 bg-surface border border-border-mid rounded-md px-3.5 py-2.5">
                  <div className="min-w-6 text-muted font-mono font-bold text-[13px]">{i + 1}</div>
                  <PairAvatar
                    name1={p1}
                    name2={p2}
                    src1={player1?.linked_avatar_url ?? null}
                    src2={player2?.linked_avatar_url ?? null}
                    size={26}
                  />
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
