import { useState } from "react";
import S from "../../styles/theme";
import {  getPairLabel } from "../../utils/helpers";
import Modal from "../shared/Modal";
import { isLoggedIn } from '../../utils/auth';

export default function PairManager({ tournament, onAdd, onEdit, onDelete }) {
  const { players, pairs = [] } = tournament;
  const [showAdd, setShowAdd]       = useState(false);
  const [newP1, setNewP1]           = useState("");
  const [newP2, setNewP2]           = useState("");
  const [editId, setEditId]         = useState(null);
  const [editP1, setEditP1]         = useState("");
  const [editP2, setEditP2]         = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const loggedIn = isLoggedIn();

  // Players not already in a pair
  const assignedIds = pairs.flatMap((p) => [p.p1, p.p2]);
  const freePlayers = players.filter((p) => !assignedIds.includes(p.id));

  function handleAdd() {
    if (!newP1 || !newP2) return;
    onAdd(newP1, newP2);
    setNewP1(""); setNewP2(""); setShowAdd(false);
  }

  function startEdit(pair) {
    setEditId(pair.id); setEditP1(pair.p1); setEditP2(pair.p2);
  }

  function confirmEdit() {
    if (!editP1 || !editP2) return;
    onEdit(editId, editP1, editP2);
    setEditId(null);
  }

  return (
    <div style={{ ...S.manageSection, marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ ...S.sectionTitle, fontSize: 13, marginBottom: 0 }}>PAREJAS</div>
        {loggedIn ?? (
          <button onClick={() => setShowAdd(!showAdd)} style={S.primaryBtn}>
            {showAdd ? "Cancelar" : "+ Nueva pareja"}
          </button>
        )}
      </div>

      {showAdd && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <select style={{ ...S.select, flex: 1, marginBottom: 0 }} value={newP1}
            onChange={(e) => setNewP1(e.target.value)}>
            <option value="">Jugador 1</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === newP2}>
                {p.name}{freePlayers.some(fp => fp.id === p.id) ? "" : " (en pareja)"}
              </option>
            ))}
          </select>
          <span style={{ color: "#555", alignSelf: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>&</span>
          <select style={{ ...S.select, flex: 1, marginBottom: 0 }} value={newP2}
            onChange={(e) => setNewP2(e.target.value)}>
            <option value="">Jugador 2</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === newP1}>
                {p.name}{freePlayers.some(fp => fp.id === p.id) ? "" : " (en pareja)"}
              </option>
            ))}
          </select>
          <button onClick={handleAdd} style={S.primaryBtn}>Agregar</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {pairs.map((pair) => (
          <div key={pair.id} style={S.playerRow}>
            {editId === pair.id ? (
              <>
                <select style={{ ...S.select, flex: 1, marginBottom: 0, fontSize: 13 }}
                  value={editP1} onChange={(e) => setEditP1(e.target.value)}>
                  <option value="">Jugador 1</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === editP2}>{p.name}</option>
                  ))}
                </select>
                <span style={{ color: "#555", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>&</span>
                <select style={{ ...S.select, flex: 1, marginBottom: 0, fontSize: 13 }}
                  value={editP2} onChange={(e) => setEditP2(e.target.value)}>
                  <option value="">Jugador 2</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === editP1}>{p.name}</option>
                  ))}
                </select>
                <button onClick={confirmEdit} style={{ ...S.primaryBtn, padding: "6px 12px", fontSize: 12 }}>✓</button>
                <button onClick={() => setEditId(null)} style={{ ...S.resetBtn, padding: "6px 10px" }}>✕</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, color: "#ccc", fontFamily: "'Barlow', sans-serif" }}>
                  {getPairLabel(pair.id, pairs, players)}
                </span>
                {loggedIn ?? (
                  <>
                  <button onClick={() => startEdit(pair)} style={S.actionBtn}>✏️</button>
                  <button onClick={() => setDeleteTarget(pair)} style={{ ...S.actionBtn, color: "#f04a4a" }}>🗑️</button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {deleteTarget && (
        <Modal
          title="¿Eliminar esta pareja?"
          message="Los partidos ya jugados con esta pareja se conservan. Esta acción no se puede deshacer."
          confirmText="Eliminar"
          confirmDanger
          onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}