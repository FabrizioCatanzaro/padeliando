import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmt, calcStandings, tournamentDisplayStatus, TOURNAMENT_STATUS_META } from "../../utils/helpers";
import { useTournament } from "../../hooks/useTournament";
import { useAuth } from "../../context/useAuth";
import Standings    from "../Standings/Standings";
import Matches      from "../Matches/Matches";
import Stats        from "../Stats/Stats";
import Management   from "../Management/Management";
import Previa       from "../Americano/Previa";
import Bracket      from "../Americano/Bracket";
import PhotoGallery from "../Photos/PhotoGallery";
import { Check, Pencil, Share2, Eye, Trophy, Settings, Flame, ChartNoAxesCombined, ChevronLeft, X, List, Split, User, Users, Building2, Calendar } from "lucide-react";
import Badge from "../shared/Badge";
import { TournamentHeaderSkeleton, TabsSkeleton, CardSkeleton } from "../shared/Skeleton";
import Btn from "../shared/Btn";

const LIGA_TABS = [
  { id: "standings",  label: "TABLA",         icon: Trophy              },
  { id: "matches",    label: "PARTIDOS",       icon: Flame               },
  { id: "stats",      label: "ESTADÍSTICAS",   icon: ChartNoAxesCombined },
  { id: "management", label: "GESTIÓN",        icon: Settings            },
];

const AMERICANO_TABS = [
  { id: "standings",  label: "TABLA",          icon: Trophy              },
  { id: "previa",     label: "PREVIA",         icon: List                },
  { id: "bracket",    label: "CUADRO",        icon: Split           },
  { id: "stats",      label: "ESTADÍSTICAS",   icon: ChartNoAxesCombined },
  { id: "management", label: "GESTIÓN",        icon: Settings            },
];

export default function Main() {
  const { groupId, tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isPremium = user?.subscription?.plan === 'premium';
  const {
    tournament, groupName, groupEmojis, groupOwnerIsPremium, loading, error, saved, isOwner,
    handleAddMatch, handleEditMatch, handleDeleteMatch,
    handleAddPlayer, handleEditPlayer, handleDeletePlayer,
    handleAddPair, handleEditPair, handleDeletePair,
    handleResetScores, handleDeleteTournament,
    getShareLink, handleToggleStatus, handleUpdateName, handleUpdateClubEvent, handleSetLiveMatch,
    handleGenerateSchedule, handleGenerateBracket, handleUpdateBracketMatch, handleSetBracket,
    handleUpdateMode, refresh,
  } = useTournament(groupId, tournamentId);

  const [tab, setTab]         = useState(null);
  const [copied, setCopied]   = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState("");

  // Derivar el tab activo sin setState en effect: null = aún no eligió el usuario
  const activeTab = tab ?? (tournament?.format === 'americano' ? 'previa' : 'standings');

  useEffect(() => {
    if (!loading && tournament && !isOwner) {
      navigate(`/view/${tournamentId}`, { replace: true });
    }
  }, [loading, tournament, isOwner, tournamentId, navigate]);

  if (loading) return (
    <div className="bg-base text-content font-sans pb-24 sm:pb-15">
      <TournamentHeaderSkeleton />
      <TabsSkeleton count={5} />
      <div className="p-6 flex flex-col gap-3">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
      </div>
    </div>
  );
  if (error || !tournament) return (
    <div className="bg-base text-content font-sans flex items-center justify-center">
      <div className="text-danger p-10">{error ?? "Error cargando torneo"}</div>
    </div>
  );

  const isAmericano = tournament.format === 'americano';
  const TABS = isAmericano ? AMERICANO_TABS : LIGA_TABS;
  const canEditMatches = isOwner && tournament.status !== 'finished';

  const shareLink   = getShareLink();
  const bracketPlayed = isAmericano
    ? [...(tournament.bracket?.octavos ?? []), ...(tournament.bracket?.cuartos ?? []),
       ...(tournament.bracket?.semis   ?? []), ...(tournament.bracket?.final ? [tournament.bracket.final] : [])]
      .filter(m => m.winner_id != null).length
    : 0;
  const playedCount = tournament.matches.filter((m) => m.score1 !== "").length + bracketPlayed;
  const statusMeta = TOURNAMENT_STATUS_META[tournamentDisplayStatus({
    status: tournament.status, event_date: tournament.event_date, hasPlayed: playedCount > 0,
  })];

  // Ganador(es) de la torneo — solo cuando está finalizada
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

  const copyLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament.name,
          text: `¡Te invito a ver "${tournament.name}"! Seguí los resultados en vivo acá:`,
          url: shareLink,
        });
      } catch { /* usuario canceló */ }
    } else {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-base text-content font-sans pb-24 sm:pb-15">
      <div className="px-6 pt-5 pb-5 border-b border-border bg-gradient-to-b from-surface/25 to-transparent">
        {/* Breadcrumbs + acciones principales */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Btn size="sm" onClick={() => navigate(`/cat/${groupId}`)} icon={ChevronLeft}>
              Volver
            </Btn>
            {groupName && (
              <div
                onClick={() => navigate(`/cat/${groupId}`)}
                className="inline-flex items-center gap-1.5 bg-surface border border-border-mid rounded-full px-3 py-1 cursor-pointer hover:border-border-strong transition-colors"
              >
                {groupEmojis?.length > 0 && (
                  <span className="text-sm leading-none">{groupEmojis.join(' ')}</span>
                )}
                <span className="text-[11px] font-mono text-muted">{groupName}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Btn size="sm" onClick={() => window.open(shareLink, '_blank', 'noopener')} icon={Eye} title="Ver como espectador">
            </Btn>
            <Btn variant="primary" size="sm" onClick={copyLink} icon={copied ? Check : Share2}>
            </Btn>
          </div>
        </div>

        {/* Título + edit */}
        {editingName ? (
          <div className="flex items-center gap-2 mb-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameInput.trim()) { handleUpdateName(nameInput.trim()); setEditingName(false); }
                if (e.key === 'Escape') setEditingName(false);
              }}
              className="bg-surface border border-border-mid text-white px-2.5 py-1 font-condensed font-bold text-[28px] tracking-wide rounded-sm outline-none flex-1 min-w-0 max-w-md"
            />
            <Btn variant="primary" size="sm" onClick={() => { if (nameInput.trim()) { handleUpdateName(nameInput.trim()); } setEditingName(false); }} icon={Check} />
            <Btn size="sm" onClick={() => setEditingName(false)} icon={X} />
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-condensed font-bold text-[32px] text-white tracking-wide leading-tight">
              {tournament.name}
            </h1>
            {isOwner && (
              <div
                onClick={() => { setNameInput(tournament.name); setEditingName(true); }}
                className="bg-transparent text-muted border border-border-strong px-1.5 py-1.5 text-[11px] cursor-pointer rounded-sm font-sans hover:text-white transition-colors"
              >
                <Pencil size={12} />
              </div>
            )}
          </div>
        )}

        {/* Estado + ganador */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <Badge variant="status" color={statusMeta.color}>
            {statusMeta.label}
          </Badge>
          {winnerLabel && (
            <Badge variant="chip" color="brand" icon={Trophy}>{winnerLabel}</Badge>
          )}
        </div>

        {/* Chips con datos del torneo */}
        <div className="flex gap-1.5 flex-wrap">
          <Badge icon={Calendar}>{fmt(tournament.event_date ?? tournament.createdAt)}</Badge>
          <Badge icon={isAmericano ? Users : User}>
            {isAmericano ? `${tournament.pairs.length}` : `${tournament.players.filter((p) => !p.removed).length}`}
          </Badge>
          <Badge icon={Flame}>{playedCount} PJ</Badge>
          <Badge color={isAmericano ? 'brand' : tournament.mode === 'pairs' ? 'cyan' : 'brand'}>
            {isAmericano ? 'americano' : tournament.mode === 'pairs' ? 'parejas fijas' : 'equipos libres'}
          </Badge>
        </div>

        {/* Club */}
        {tournament.club_id && (
          <div className="flex gap-1.5 flex-wrap mt-2.5">
            <button
              onClick={() => navigate(`/club/${tournament.club_id}`)}
              className="inline-flex items-center gap-1.5 bg-surface border border-border-mid rounded-full px-3 py-1 cursor-pointer hover:border-brand transition-colors text-[11px] font-mono text-muted"
            >
              <Building2 size={11} className="text-brand" />
              <span className="truncate max-w-[180px]">{tournament.club_name ?? 'Club'}</span>
            </button>
          </div>
        )}
      </div>

      {saved && <div className="bg-[#1a2e1a] text-green px-4 py-1.5 text-[12px] font-mono text-center">✓ Guardado</div>}

      {isOwner && isAmericano && tournament.status === 'active' && tournament.bracket?.final?.winner_id && (
        <div className="px-6 py-3 border-b border-border bg-surface-alt flex items-center justify-between gap-3">
          <span className="text-muted font-mono text-[12px]">La final fue jugada. ¿Querés cerrar el torneo?</span>
          <Btn variant="primary" size="sm" onClick={handleToggleStatus}>FINALIZAR TORNEO</Btn>
        </div>
      )}

      {/* Tabs — desktop (sm+) */}
      <div className="hidden sm:flex border-b border-border px-4 items-center overflow-x-auto">
        {TABS.map((t) => (
          <div key={t.id} onClick={() => setTab(t.id)}
            className={`bg-transparent border-0 px-3.5 py-3.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer border-b-2 whitespace-nowrap transition-all hover:text-brand ${activeTab === t.id ? 'text-brand border-b-brand' : 'text-muted border-b-transparent'}`}>
             <t.icon size={14} className="inline mr-1.5" />{t.label}
          </div>
        ))}
      </div>

      {/* Bottom nav — mobile only */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-base border-t border-border flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 bg-transparent border-0 cursor-pointer transition-colors ${activeTab === t.id ? 'text-brand' : 'text-muted'}`}
          >
            <t.icon size={20} />
            <span className="text-[9px] font-mono tracking-wide leading-none">
              {t.id === 'standings'  ? 'TABLA'    :
               t.id === 'matches'   ? 'PARTIDOS' :
               t.id === 'previa'    ? 'PREVIA'   :
               t.id === 'bracket'   ? 'CUADRO'   :
               t.id === 'stats'     ? 'STATS'    : 'GESTIÓN'}
            </span>
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Liga tabs */}
        {activeTab === "standings"  && <Standings  tournament={tournament} />}
        {activeTab === "matches"    && <Matches    tournament={tournament} isOwner={canEditMatches} onAddMatch={handleAddMatch} onEditMatch={handleEditMatch} onDeleteMatch={handleDeleteMatch} onSetLiveMatch={handleSetLiveMatch} />}
        {activeTab === "stats"      && <Stats      tournament={tournament} ownerIsPremium={groupOwnerIsPremium} />}

        {/* Americano tabs */}
        {activeTab === "previa" && (
          <Previa
            tournament={tournament}
            isOwner={canEditMatches}
            onAddMatch={handleAddMatch}
            onEditMatch={handleEditMatch}
            onDeleteMatch={handleDeleteMatch}
            onSetLiveMatch={handleSetLiveMatch}
            onGenerateSchedule={handleGenerateSchedule}
            onGenerateBracket={handleGenerateBracket}
          />
        )}
        {activeTab === "bracket" && (
          <Bracket
            tournament={tournament}
            isOwner={canEditMatches}
            onGenerateBracket={handleGenerateBracket}
            onUpdateMatch={handleUpdateBracketMatch}
            onSetBracket={handleSetBracket}
            onSetLiveMatch={handleSetLiveMatch}
          />
        )}

        {/* Gestión (shared) */}
        {activeTab === "management" && (
          <Management
            tournament={tournament}
            isOwner={isOwner}
            onAddPlayer={handleAddPlayer}
            onEditPlayer={handleEditPlayer}
            onDeletePlayer={handleDeletePlayer}
            onAddPair={handleAddPair}
            onEditPair={handleEditPair}
            onDeletePair={handleDeletePair}
            onResetScores={handleResetScores}
            onDeleteTournament={async () => { await handleDeleteTournament(); navigate(`/cat/${groupId}`); }}
            onToggleStatus={handleToggleStatus}
            onUpdateMode={handleUpdateMode}
            onUpdateClubEvent={handleUpdateClubEvent}
            onRefresh={refresh}
          />
        )}

        <PhotoGallery
          tournamentId={tournament.id}
          isOwner={isOwner}
          isPremium={isPremium}
        />
      </div>
    </div>
  );
}
