import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmt, calcStandings } from "../../utils/helpers";
import { useTournament } from "../../hooks/useTournament";
import { useAuth } from "../../context/useAuth";
import Standings    from "../Standings/Standings";
import Matches      from "../Matches/Matches";
import Stats        from "../Stats/Stats";
import Management   from "../Management/Management";
import Previa       from "../Americano/Previa";
import Bracket      from "../Americano/Bracket";
import PhotoGallery from "../Photos/PhotoGallery";
import { Check, Pencil, Share2, Trophy, Settings, Flame, ChartNoAxesCombined, ChevronLeft, X, List, Split } from "lucide-react";
import Loader from "../Loader/Loader";

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
    getShareLink, handleToggleStatus, handleUpdateName, handleSetLiveMatch,
    handleGenerateSchedule, handleGenerateBracket, handleUpdateBracketMatch, handleSetBracket,
    handleUpdateMode,
  } = useTournament(groupId, tournamentId);

  const [tab, setTab]         = useState(null);
  const [copied, setCopied]   = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState("");

  // Derivar el tab activo sin setState en effect: null = aún no eligió el usuario
  const activeTab = tab ?? (tournament?.format === 'americano' ? 'previa' : 'standings');

  useEffect(() => {
    if (!loading && tournament && !isOwner) {
      navigate(`/readonly/${tournamentId}`, { replace: true });
    }
  }, [loading, tournament, isOwner, tournamentId, navigate]);

  if (loading) return <Loader />;
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
    <div className="bg-base text-content font-sans pb-15">
      <div className="px-6 pt-5 pb-5 border-b border-border bg-gradient-to-b from-surface/25 to-transparent">
        {/* Breadcrumbs + acciones principales */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              onClick={() => navigate(`/cat/${groupId}`)}
              className="flex flex-row gap-1.5 items-center text-muted border border-border-strong px-2.5 py-1 text-[11px] cursor-pointer rounded-sm font-sans hover:text-white transition-colors"
            >
              <ChevronLeft size={14} />
              <span>Volver</span>
            </div>
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
            <div onClick={() => { if (nameInput.trim()) { handleUpdateName(nameInput.trim()); } setEditingName(false); }} className="bg-brand text-base border-0 px-2 py-2 font-condensed font-bold text-[12px] cursor-pointer rounded-sm">
              <Check size={15} />
            </div>
            <div onClick={() => setEditingName(false)} className="bg-transparent text-muted border border-border-strong px-2 py-2 font-condensed text-[12px] cursor-pointer rounded-sm">
              <X size={15} />
            </div>
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
          <span className={`text-[11px] font-mono ${tournament.status === 'active' ? 'text-green' : 'text-muted'}`}>
            {tournament.status === 'active' ? '● EN CURSO' : '■ FINALIZADA'}
          </span>
          {winnerLabel && (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-brand font-mono">
              <Trophy size={13} /> {winnerLabel}
            </span>
          )}
        </div>

        {/* Chips con datos de la torneo */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="inline-flex items-center bg-surface border border-border-mid rounded-full px-2.5 py-0.5 text-[11px] font-mono text-muted">
            {fmt(tournament.createdAt)}
          </span>
          <span className="inline-flex items-center bg-surface border border-border-mid rounded-full px-2.5 py-0.5 text-[11px] font-mono text-muted">
            {isAmericano ? `${tournament.pairs.length} parejas` : `${tournament.players.filter((p) => !p.removed).length} jugadores`}
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

      {saved && <div className="bg-[#1a2e1a] text-green px-4 py-1.5 text-[12px] font-mono text-center">✓ Guardado</div>}

      {isOwner && isAmericano && tournament.status === 'active' && tournament.bracket?.final?.winner_id && (
        <div className="px-6 py-3 border-b border-border bg-surface-alt flex items-center justify-between gap-3">
          <span className="text-muted font-mono text-[12px]">La final fue jugada. ¿Querés cerrar la torneo?</span>
          <button
            onClick={handleToggleStatus}
            className="bg-brand text-base border-0 px-4 py-2 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm whitespace-nowrap"
          >
            ■ FINALIZAR TORNEO
          </button>
        </div>
      )}

      <div className="flex border-b border-border px-4 items-center overflow-x-auto">
        {TABS.map((t) => (
          <div key={t.id} onClick={() => setTab(t.id)}
            className={`bg-transparent border-0 px-3.5 py-3.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer border-b-2 whitespace-nowrap transition-all hover:text-brand ${activeTab === t.id ? 'text-brand border-b-brand' : 'text-muted border-b-transparent'}`}>
             <t.icon size={14} className="inline mr-1.5" />{t.label}
          </div>
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
