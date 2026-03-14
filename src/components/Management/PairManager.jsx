import { useState } from "react";
import { getPairLabel } from "../../utils/helpers";
import Modal from "../shared/Modal";
import { Pencil, Trash2 } from "lucide-react";
export default function PairManager({ tournament, isOwner, onAdd, onEdit, onDelete }) {
  const { players, pairs = [] } = tournament;
  const [showAdd, setShowAdd]       = useState(false);
  const [newP1, setNewP1]           = useState("");
  const [newP2, setNewP2]           = useState("");
  const [editId, setEditId]         = useState(null);
  const [editP1, setEditP1]         = useState("");
  const [editP2, setEditP2]         = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    <div className="bg-surface border border-border-mid rounded-lg p-4 mb-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted">PAREJAS</div>
        {isOwner && (
          <button onClick={() => setShowAdd(!showAdd)} className="bg-brand text-base border-0 px-5 py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm whitespace-nowrap">
            {showAdd ? "Cancelar" : "+ Nueva pareja"}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-3 flex-wrap">
          <select className="flex-1 bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
            value={newP1} onChange={(e) => setNewP1(e.target.value)}>
            <option value="">Jugador 1</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === newP2}>
                {p.name}{freePlayers.some(fp => fp.id === p.id) ? "" : " (en pareja)"}
              </option>
            ))}
          </select>
          <span className="text-muted self-center font-condensed font-bold">&</span>
          <select className="flex-1 bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
            value={newP2} onChange={(e) => setNewP2(e.target.value)}>
            <option value="">Jugador 2</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === newP1}>
                {p.name}{freePlayers.some(fp => fp.id === p.id) ? "" : " (en pareja)"}
              </option>
            ))}
          </select>
          <button onClick={handleAdd} className="bg-brand text-base border-0 px-5 py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm whitespace-nowrap">
            Agregar
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {pairs.map((pair) => (
          <div key={pair.id} className="flex items-center gap-2 bg-base border border-border-mid rounded-md px-3 py-2">
            {editId === pair.id ? (
              <>
                <select className="flex-1 bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
                  value={editP1} onChange={(e) => setEditP1(e.target.value)}>
                  <option value="">Jugador 1</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === editP2}>{p.name}</option>
                  ))}
                </select>
                <span className="text-muted font-condensed font-bold">&</span>
                <select className="flex-1 bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
                  value={editP2} onChange={(e) => setEditP2(e.target.value)}>
                  <option value="">Jugador 2</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === editP1}>{p.name}</option>
                  ))}
                </select>
                <button onClick={confirmEdit} className="bg-brand text-base border-0 px-3 py-1.5 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm">✓</button>
                <button onClick={() => setEditId(null)} className="bg-transparent text-muted border border-border-strong px-2.5 py-1.5 text-[12px] cursor-pointer rounded-sm font-sans">✕</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-content font-sans">
                  {getPairLabel(pair.id, pairs, players)}
                </span>
                {isOwner && (
                  <>
                    <div onClick={() => startEdit(pair)} className="bg-transparent border-0 text-muted cursor-pointer text-[12px] font-sans px-1.5 py-0.5">
                      <Pencil size={15} />
                    </div>
                    <div onClick={() => setDeleteTarget(pair)} className="bg-transparent border-0 text-danger cursor-pointer text-[12px] font-sans px-1.5 py-0.5">
                      <Trash2 size={15} />
                    </div>
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
