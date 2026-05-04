import { useState } from "react";
import Modal from "../shared/Modal";
import PlayerManager from "./PlayerManager";
import PairManager from "./PairManager";
import { Play, RotateCcw, TicketCheck, Trash2 } from "lucide-react";
export default function Management({
  tournament, isOwner,
  onAddPlayer, onEditPlayer, onDeletePlayer,
  onAddPair, onEditPair, onDeletePair,
  onResetScores, onDeleteTournament, onToggleStatus, onUpdateMode,
}) {
  const [resetModal, setResetModal]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const activePlayers = tournament.players.filter((p) => !p.removed).length;
  const showModeToggle = tournament.format === 'liga' && activePlayers >= 4;
  const canPickPairs   = activePlayers % 2 === 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted">GESTIÓN DEL TORNEO</div>
      </div>

      <PlayerManager
        tournament={tournament}
        isOwner={isOwner}
        onAdd={onAddPlayer}
        onEdit={onEditPlayer}
        onDelete={onDeletePlayer}
      />

      {showModeToggle && isOwner && (
        <div className="bg-surface border border-border-mid rounded-lg p-4 mt-2">
          <div className="font-condensed font-bold text-[11px] tracking-[2px] text-muted mb-2">MODO DE JUEGO</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => tournament.mode !== 'free' && onUpdateMode('free')}
              className={`flex-1 py-2.5 text-[12px] font-condensed font-bold tracking-wide rounded-sm border transition cursor-pointer ${tournament.mode === 'free' ? 'bg-brand/15 border-brand text-brand' : 'bg-surface-alt border-border-mid text-muted hover:border-border-strong'}`}
            >
              EQUIPOS LIBRES
            </button>
            <button
              type="button"
              onClick={() => { if (canPickPairs && tournament.mode !== 'pairs') onUpdateMode('pairs'); }}
              disabled={!canPickPairs}
              className={`flex-1 py-2.5 text-[12px] font-condensed font-bold tracking-wide rounded-sm border transition ${
                !canPickPairs
                  ? 'border-border-mid text-dim cursor-not-allowed opacity-40'
                  : tournament.mode === 'pairs'
                    ? 'bg-brand/15 border-brand text-brand cursor-pointer'
                    : 'bg-surface-alt border-border-mid text-muted hover:border-border-strong cursor-pointer'
              }`}
            >
              PAREJAS FIJAS
            </button>
          </div>
          {!canPickPairs && (
            <p className="text-[10px] text-dim font-mono mt-1.5">Número impar de jugadores — parejas fijas no disponible.</p>
          )}
        </div>
      )}

      {tournament.mode === "pairs" && (
        <PairManager
          tournament={tournament}
          isOwner={isOwner}
          onAdd={onAddPair}
          onEdit={onEditPair}
          onDelete={onDeletePair}
        />
      )}

      {isOwner && (
        <div className="bg-[#0d0a0a] border border-danger/13 rounded-lg p-4 mt-2">
          <div className="font-condensed font-bold text-[13px] tracking-[3px] text-danger/40 mb-3">
            ZONA DE PELIGRO
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <div
              onClick={() => setResetModal(true)}
              className="flex flex-row gap-2 items-center bg-transparent border border-danger/40 text-danger px-4 py-2.25 text-[13px] cursor-pointer rounded-sm font-sans"
            >
              <RotateCcw size={15} /> Reiniciar puntos
            </div>
            <div
              onClick={() => setDeleteModal(true)}
              className="flex flex-row gap-2 bg-danger/13 border border-danger text-danger px-4 py-2.25 text-[13px] cursor-pointer rounded-sm font-sans"
            >
              <Trash2 size={15} /> Eliminar torneo
            </div>
            <button
              onClick={() => onToggleStatus()}
              className={`bg-transparent px-4 py-2.25 text-[13px] cursor-pointer rounded-sm font-sans border ${
                tournament.status === 'active'
                  ? 'border-brand/40 text-brand'
                  : 'border-green/40 text-green'
              }`}
            >
              {tournament.status === 'active' ? (
                <div className="flex flex-row gap-2 items-center">
                  <TicketCheck size={15} />
                  <span>Finalizar torneo</span>
                </div>
              ) : (
                <div className="flex flex-row gap-2 items-center">
                  <Play size={15} />
                  <span>Reanudar torneo</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {resetModal && (
        <Modal
          title="¿Reiniciar puntos?"
          message="Se eliminarán todos los partidos registrados. Los jugadores y parejas se mantienen. Esta acción no se puede deshacer."
          confirmText="Sí, reiniciar"
          confirmDanger
          onConfirm={() => { onResetScores(); setResetModal(false); }}
          onCancel={() => setResetModal(false)}
        />
      )}

      {deleteModal && (
        <Modal
          title="¿Eliminar torneo?"
          message="Se eliminará el torneo actual por completo. Los jugadores quedan en la base de datos para estadísticas históricas. Esta acción no se puede deshacer."
          confirmText="Sí, eliminar"
          confirmDanger
          onConfirm={() => { onDeleteTournament(); setDeleteModal(false); }}
          onCancel={() => setDeleteModal(false)}
        />
      )}
    </div>
  );
}
