import { useState } from "react";
import S from "../../styles/theme";
import PlayerInput from "../Setup/PlayerInput";
import Modal from "../shared/Modal";
import { isLoggedIn } from '../../utils/auth';

export default function PlayerManager({ tournament, dbPlayers, onAdd, onEdit, onDelete }) {
  const [newName, setNewName]     = useState("");
  const [editId, setEditId]       = useState(null);
  const [editName, setEditName]   = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const loggedIn = isLoggedIn();

  function handleAdd() {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName("");
    setShowAdd(false);
  }

  function startEdit(p) { setEditId(p.id); setEditName(p.name); }

  function confirmEdit() {
    if (!editName.trim()) return;
    onEdit(editId, editName.trim());
    setEditId(null);
    setEditName("");
  }

  const hasMatches = (playerId) =>
    tournament.matches.some((m) => [...m.team1, ...m.team2].includes(playerId));

  return (
    <div style={S.manageSection}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ ...S.sectionTitle, fontSize: 13, marginBottom: 0 }}>JUGADORES</div>
        {loggedIn ?? (
          <button onClick={() => setShowAdd(!showAdd)} style={S.primaryBtn}>
            {showAdd ? "Cancelar" : "+ Agregar"}
          </button>
        )}
      </div>

      {showAdd && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <PlayerInput
            value={newName}
            onChange={setNewName}
            placeholder="Nombre del jugador"
          />
          <button onClick={handleAdd} style={S.primaryBtn}>Agregar</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tournament.players.map((p) => (
          <div key={p.id} style={S.playerRow}>
            {editId === p.id ? (
              <>
                <input
                  style={{ ...S.input, flex: 1, marginBottom: 0, fontSize: 13 }}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                  autoFocus
                />
                <button onClick={confirmEdit} style={{ ...S.primaryBtn, padding: "6px 12px", fontSize: 12 }}>✓</button>
                <button onClick={() => setEditId(null)} style={{ ...S.resetBtn, padding: "6px 10px" }}>✕</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, color: "#ccc", fontFamily: "'Barlow', sans-serif" }}>{p.name}</span>
                {hasMatches(p.id) && (
                  <span style={{ fontSize: 10, color: "#555", fontFamily: "'Courier New', monospace" }}>
                    {tournament.matches.filter(m => [...m.team1, ...m.team2].includes(p.id)).length}P
                  </span>
                )}
                {loggedIn ?? (
                  <>
                    <button onClick={() => startEdit(p)} style={S.actionBtn}>✏️</button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      style={{ ...S.actionBtn, color: "#f04a4a" }}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {deleteTarget && (
        <Modal
          title={`¿Eliminar a ${deleteTarget.name}?`}
          message={
            hasMatches(deleteTarget.id)
              ? `${deleteTarget.name} tiene partidos registrados. Al eliminarlo esos partidos quedarán con datos incompletos.`
              : `Se eliminará ${deleteTarget.name} del torneo. Sus estadísticas históricas se conservan.`
          }
          confirmText="Eliminar"
          confirmDanger
          onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}