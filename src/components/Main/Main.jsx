import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmt } from "../../utils/helpers";
import { useTournament } from "../../hooks/useTournament";
import Standings    from "../Standings/Standings";
import Matches      from "../Matches/Matches";
import Stats        from "../Stats/Stats";
import Management   from "../Management/Management";
import { Check, Pencil, Share2, Trophy, Settings, Flame, ChartNoAxesCombined, ChevronLeft, X } from "lucide-react";
import { SkeletonGrid } from "../shared/Skeleton";

const TABS = [
  { id: "standings",  label: "TABLA",         icon: Trophy              },
  { id: "matches",    label: "PARTIDOS",       icon: Flame               },
  { id: "stats",      label: "ESTADÍSTICAS",   icon: ChartNoAxesCombined },
  { id: "management", label: "GESTIÓN",        icon: Settings            },
];

export default function Main() {
  const { groupId, tournamentId } = useParams();
  const navigate = useNavigate();
  const {
    tournament, loading, error, saved, isOwner,
    handleAddMatch, handleEditMatch, handleDeleteMatch,
    handleAddPlayer, handleEditPlayer, handleDeletePlayer,
    handleAddPair, handleEditPair, handleDeletePair,
    handleResetScores, handleDeleteTournament,
    getShareLink, handleToggleStatus, handleUpdateName,
  } = useTournament(groupId, tournamentId);

  const [tab, setTab]         = useState("standings");
  const [copied, setCopied]   = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState("");

  if (loading) return <SkeletonGrid count={3} />;
  if (error || !tournament) return (
    <div className="bg-base text-content font-sans flex items-center justify-center">
      <div className="text-danger p-10">{error ?? "Error cargando torneo"}</div>
    </div>
  );

  const shareLink   = getShareLink();
  const playedCount = tournament.matches.filter((m) => m.score1 !== "").length;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };  

  return (
    <div className="bg-base text-content font-sans pb-15">
      <div className="px-6 pt-6 pb-5 flex justify-between items-start flex-wrap gap-3 border-b border-border">
        <div>
          <div onClick={() => navigate(`/groups/${groupId}`)} className="flex flex-row gap-2 items-center w-fit bg-transparent text-muted border border-border-strong px-3 py-1.5 text-[12px] cursor-pointer rounded-sm font-sans mb-2">
            <ChevronLeft size={15} />
            <span>Volver</span>
          </div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nameInput.trim()) { handleUpdateName(nameInput.trim()); setEditingName(false); }
                  if (e.key === 'Escape') setEditingName(false);
                }}
                className="bg-surface border border-border-mid text-white px-2.5 py-1 font-condensed font-bold text-[24px] tracking-wide rounded-sm outline-none"
              />
              <div onClick={() => { if (nameInput.trim()) { handleUpdateName(nameInput.trim()); } setEditingName(false); }} className="bg-brand text-base border-0 px-2 py-2 font-condensed font-bold text-[12px] cursor-pointer rounded-sm">
                <Check size={15} />
              </div>
              <div onClick={() => setEditingName(false)} className="bg-transparent text-muted border border-border-strong px-2 py-2 font-condensed text-[12px] cursor-pointer rounded-sm">
                <X size={15} />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="font-condensed font-bold text-[28px] text-white tracking-wide">{tournament.name}</div>
              {isOwner && (
                <div onClick={() => { setNameInput(tournament.name); setEditingName(true); }} className="bg-transparent text-muted border border-border-strong px-2 py-2 text-[11px] cursor-pointer rounded-sm font-sans">
                  <Pencil size={13}/>
                </div>
              )}
            </div>
          )}
          <span className={`text-xs font-mono ${tournament.status === 'active' ? 'text-green' : 'text-muted'}`}>
            {tournament.status === 'active' ? '● EN CURSO' : '■ FINALIZADA'}
          </span>
          <div className="text-[11px] text-muted font-mono mt-1">
            Creado el {fmt(tournament.createdAt)} · {tournament.players.length} jugadores ·{" "}
            {playedCount} partidos ·{" "}
            <span className={tournament.mode === "pairs" ? "text-cyan" : "text-brand"}>
              {tournament.mode === "pairs" ? "parejas fijas" : "equipos libres"}
            </span>
          </div>
        </div>
        <div onClick={copyLink} className="bg-brand text-base border-0 px-4 py-2 font-condensed font-bold tracking-wide text-sm cursor-pointer rounded-sm">
          {copied ? (
            <div className="flex flex-row items-center justify-between gap-2">
              <Check size={15} />
              <span>COPIADO!</span>
            </div>
          ) : (
            <div className="flex flex-row items-center justify-between gap-2">
              <Share2 size={15} />
              <span>COMPARTIR</span>
            </div>
          )}
        </div>
      </div>

      {saved && <div className="bg-[#1a2e1a] text-green px-4 py-1.5 text-[12px] font-mono text-center">✓ Guardado</div>}

      <div className="flex border-b border-border px-4 items-center overflow-x-auto">
        {TABS.map((t) => (
          <div key={t.id} onClick={() => setTab(t.id)}
            className={`bg-transparent border-0 px-3.5 py-3.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer border-b-2 whitespace-nowrap transition-all hover:text-brand ${tab === t.id ? 'text-brand border-b-brand' : 'text-muted border-b-transparent'}`}>
             <t.icon size={14} className="inline mr-1.5" />{t.label}
          </div>
        ))}
      </div>

      <div className="p-6">
        {tab === "standings"  && <Standings  tournament={tournament} />}
        {tab === "matches"    && <Matches    tournament={tournament} isOwner={isOwner} onAddMatch={handleAddMatch} onEditMatch={handleEditMatch} onDeleteMatch={handleDeleteMatch} />}
        {tab === "stats"      && <Stats      tournament={tournament} />}
        {tab === "management" && (
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
            onDeleteTournament={async () => { await handleDeleteTournament(); navigate(`/groups/${groupId}`); }}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>
    </div>
  );
}
