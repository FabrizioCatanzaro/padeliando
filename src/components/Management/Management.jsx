import { useState } from "react";
import Modal from "../shared/Modal";
import PlayerManager from "./PlayerManager";
import PairManager from "./PairManager";
import { Play, RotateCcw, TicketCheck, Trash2 } from "lucide-react";
export default function Management({
  tournament, isOwner,
  onAddPlayer, onEditPlayer, onDeletePlayer,
  onAddPair, onEditPair, onDeletePair,
  onResetScores, onDeleteTournament, onToggleStatus
}) {
  const [resetModal, setResetModal]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted">GESTIÓN DE LA JORNADA</div>
      </div>

      <PlayerManager
        tournament={tournament}
        isOwner={isOwner}
        onAdd={onAddPlayer}
        onEdit={onEditPlayer}
        onDelete={onDeletePlayer}
      />

      {(tournament.mode === "pairs" || tournament.players.filter((p) => !p.removed).length % 2 === 0) && (
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
              <Trash2 size={15} /> Eliminar jornada
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
                  <span>Finalizar jornada</span>
                </div>
              ) : (
                <div className="flex flex-row gap-2 items-center">
                  <Play size={15} />
                  <span>Reanudar jornada</span>
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
          title="¿Eliminar la jornada?"
          message="Se eliminará la jornada actual por completo. Los jugadores quedan en la base de datos para estadísticas históricas. Esta acción no se puede deshacer."
          confirmText="Sí, eliminar"
          confirmDanger
          onConfirm={() => { onDeleteTournament(); setDeleteModal(false); }}
          onCancel={() => setDeleteModal(false)}
        />
      )}
    </div>
  );
}
