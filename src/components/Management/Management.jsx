import { useState } from "react";
import S from "../../styles/theme";
import Modal from "../shared/Modal";
import PlayerManager from "./PlayerManager";
import PairManager from "./PairManager";

export default function Management({
  tournament, 
  onAddPlayer, onEditPlayer, onDeletePlayer,
  onAddPair, onEditPair, onDeletePair,
  onResetScores, onDeleteTournament, onToggleStatus
}) {
  const [resetModal, setResetModal]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  return (
    <div>
      <div style={S.sectionTitle}>GESTIÓN DE LA JORNADA</div>

      {/* Players section */}
      <PlayerManager
        tournament={tournament}
        onAdd={onAddPlayer}
        onEdit={onEditPlayer}
        onDelete={onDeletePlayer}
      />

      {/* Pairs section (only in pairs mode) */}
      {(tournament.mode === "pairs" || tournament.players.length % 2 === 0) && (
        <PairManager
          tournament={tournament}
          onAdd={onAddPair}
          onEdit={onEditPair}
          onDelete={onDeletePair}
        />
      )}

      {/* Danger zone */}
      <div style={S.dangerZone}>
        <div style={{ ...S.sectionTitle, color: "#f04a4a66", fontSize: 13, marginBottom: 12 }}>
          ZONA DE PELIGRO
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setResetModal(true)}
            style={{ ...S.dangerBtn, borderColor: "#f04a4a66" }}
          >
            🔄 Reiniciar puntos
          </button>
          <button
            onClick={() => setDeleteModal(true)}
            style={{ ...S.dangerBtn, background: "#f04a4a22", borderColor: "#f04a4a" }}
          >
            🗑️ Eliminar jornada
          </button>
          <button
            onClick={() => onToggleStatus()}
            style={{
              ...S.dangerBtn,
              borderColor: tournament.status === 'active' ? '#e8f04a66' : '#4af07a66',
              color: tournament.status === 'active' ? '#e8f04a' : '#4af07a',
            }}
          >
            {tournament.status === 'active' ? '🏁 Finalizar jornada' : '▶ Reanudar jornada'}
          </button>
        </div>
      </div>

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