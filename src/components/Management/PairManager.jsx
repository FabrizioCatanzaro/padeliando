import { useState } from "react";
import { getPairLabel } from "../../utils/helpers";
import Modal from "../shared/Modal";
import { Check, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { PairAvatar } from "../shared/PlayerAvatar";
export default function PairManager({ tournament, isOwner, onAdd, onEdit, onDelete }) {
  const { players, pairs = [] } = tournament;
  const [showAdd, setShowAdd]       = useState(false);
  const [newP1, setNewP1]           = useState("");
  const [newP2, setNewP2]           = useState("");
  const [editId, setEditId]         = useState(null);
  const [editP1, setEditP1]         = useState("");
  const [editP2, setEditP2]         = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const assignedIds   = pairs.flatMap((p) => [p.p1, p.p2]);
  const activePlayers = players.filter((p) => !p.removed);
  const freePlayers   = activePlayers.filter((p) => !assignedIds.includes(p.id));

  function handleAdd() {
    if (!newP1 || !newP2 || newP1 === newP2) return;
    // No permitir armar una pareja con jugadores ya asignados a otra.
    if (assignedIds.includes(newP1) || assignedIds.includes(newP2)) return;
    onAdd(newP1, newP2);
    setNewP1(""); setNewP2(""); setShowAdd(false);
  }

  function startEdit(pair) {
    setEditId(pair.id); setEditP1(pair.p1); setEditP2(pair.p2);
  }

  function confirmEdit() {
    if (!editP1 || !editP2 || editP1 === editP2) return;
    // No permitir asignar un jugador que ya está en otra pareja.
    const otherIds = pairs.filter((pr) => pr.id !== editId).flatMap((pr) => [pr.p1, pr.p2]);
    if (otherIds.includes(editP1) || otherIds.includes(editP2)) return;
    onEdit(editId, editP1, editP2);
    setEditId(null);
  }

  return (
    <div className="bg-surface border border-border-mid rounded-lg p-4 mb-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted">
          PAREJAS
          <span className="ml-2 text-brand">{pairs.length}</span>
        </div>
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
            {activePlayers.map((p) => {
              const taken = assignedIds.includes(p.id);
              return (
                <option key={p.id} value={p.id} disabled={taken || p.id === newP2}>
                  {p.name}{taken ? " (en pareja)" : ""}
                </option>
              );
            })}
          </select>
          <span className="text-muted self-center font-condensed font-bold">&</span>
          <select className="flex-1 bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
            value={newP2} onChange={(e) => setNewP2(e.target.value)}>
            <option value="">Jugador 2</option>
            {activePlayers.map((p) => {
              const taken = assignedIds.includes(p.id);
              return (
                <option key={p.id} value={p.id} disabled={taken || p.id === newP1}>
                  {p.name}{taken ? " (en pareja)" : ""}
                </option>
              );
            })}
          </select>
          <button onClick={handleAdd} className="bg-brand text-base border-0 px-5 py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm whitespace-nowrap">
            Agregar
          </button>
        </div>
      )}

      {freePlayers.length > 0 && (
        <div className="flex items-start gap-2 bg-brand/10 border border-brand/30 rounded-md px-3.5 py-2.5 mb-3 text-[12px] font-mono text-brand leading-relaxed">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            {freePlayers.length === 1
              ? 'Hay 1 jugador sin pareja'
              : `Hay ${freePlayers.length} jugadores sin pareja`}
            {' '}— falta{Math.ceil(freePlayers.length / 2) === 1 ? '' : 'n'} armar {Math.ceil(freePlayers.length / 2)} {Math.ceil(freePlayers.length / 2) === 1 ? 'pareja' : 'parejas'}.
            <span className="block text-soft mt-0.5">{freePlayers.map((p) => p.name).join(', ')}</span>
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {pairs.map((pair, i) => (
          <div key={pair.id} className="flex items-center gap-2 bg-base border border-border-mid rounded-md px-3 py-2">
            {editId === pair.id ? (
              <>
                {(() => { const otherIds = pairs.filter(pr => pr.id !== pair.id).flatMap(pr => [pr.p1, pr.p2]); return (
                <>
                <select className="flex-1 bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
                  value={editP1} onChange={(e) => setEditP1(e.target.value)}>
                  <option value="">Jugador 1</option>
                  {activePlayers.map((p) => {
                    const taken = otherIds.includes(p.id);
                    return (
                      <option key={p.id} value={p.id} disabled={taken || p.id === editP2}>
                        {p.name}{taken ? " (en pareja)" : ""}
                      </option>
                    );
                  })}
                </select>
                <span className="text-muted font-condensed font-bold">&</span>
                <select className="flex-1 bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
                  value={editP2} onChange={(e) => setEditP2(e.target.value)}>
                  <option value="">Jugador 2</option>
                  {activePlayers.map((p) => {
                    const taken = otherIds.includes(p.id);
                    return (
                      <option key={p.id} value={p.id} disabled={taken || p.id === editP1}>
                        {p.name}{taken ? " (en pareja)" : ""}
                      </option>
                    );
                  })}
                </select>
                </>
                ); })()}
                <div onClick={confirmEdit} className="bg-brand text-base border-0 px-1.5 py-1.5 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm">
                  <Check size={12} />
                </div>
                <div onClick={() => setEditId(null)} className="bg-transparent text-muted border border-border-strong px-1.5 py-1.5 text-[12px] cursor-pointer rounded-sm font-sans">
                  <X size={12}/>
                </div>
              </>
            ) : (
              <>
                <span className="text-dim text-[11px] font-mono w-4 shrink-0 text-right tabular-nums">{i + 1}</span>
                {(() => {
                  const p1 = players.find((p) => p.id === pair.p1);
                  const p2 = players.find((p) => p.id === pair.p2);
                  return (
                    <PairAvatar
                      name1={p1?.name ?? "?"}
                      name2={p2?.name ?? "?"}
                      src1={p1?.linked_avatar_url ?? null}
                      src2={p2?.linked_avatar_url ?? null}
                      size={26}
                    />
                  );
                })()}
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
