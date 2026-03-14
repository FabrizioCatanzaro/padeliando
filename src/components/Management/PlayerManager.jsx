import { useState } from "react";
import PlayerInput from "../Setup/PlayerInput";
import Modal from "../shared/Modal";
import { Pencil, Trash2, UserPlus, X, Clock } from "lucide-react";
import { api } from "../../utils/api";
import { useAuth } from "../../context/useAuth";

export default function PlayerManager({ tournament, isOwner, onAdd, onEdit, onDelete }) {
  const [newName, setNewName]           = useState("");
  const [editId, setEditId]             = useState(null);
  const [editName, setEditName]         = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAdd, setShowAdd]           = useState(false);

  // Estado de invitaciones por jugador: { [playerId]: { open, identifier, sending, error } }
  const [inviteState, setInviteState] = useState({});
  const { isLoggedIn } = useAuth();

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

  function openInvite(playerId) {
    setInviteState(s => ({ ...s, [playerId]: { open: true, identifier: '', sending: false, error: null } }));
  }

  function closeInvite(playerId) {
    setInviteState(s => ({ ...s, [playerId]: { open: false, identifier: '', sending: false, error: null } }));
  }

  async function sendInvite(player) {
    const state = inviteState[player.id];
    if (!state?.identifier?.trim()) return;
    setInviteState(s => ({ ...s, [player.id]: { ...s[player.id], sending: true, error: null } }));
    try {
      await api.invitations.send(player.id, tournament.group_id, state.identifier.trim());
      closeInvite(player.id);
      // Forzar recarga del torneo para ver el estado de la invitación
      window.location.reload();
    } catch (e) {
      setInviteState(s => ({ ...s, [player.id]: { ...s[player.id], sending: false, error: e.message } }));
    }
  }

  async function cancelInvite(player) {
    if (!player.invitation_id) return;
    try {
      await api.invitations.cancel(player.invitation_id);
      window.location.reload();
    } catch {
      // intentionally ignored
    }
  }

  return (
    <div className="bg-surface border border-border-mid rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="font-condensed font-bold text-[13px] tracking-[3px] text-muted">JUGADORES</div>
        {isOwner && (
          <button onClick={() => setShowAdd(!showAdd)} className="bg-brand text-base border-0 px-5 py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm whitespace-nowrap">
            {showAdd ? "Cancelar" : "+ Agregar"}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-3">
          <PlayerInput
            value={newName}
            onChange={setNewName}
            placeholder="Nombre del jugador"
            groupId={tournament.group_id}
          />
          <button onClick={handleAdd} className="bg-brand text-base border-0 px-5 py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm whitespace-nowrap">
            Agregar
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {tournament.players.map((p) => (
          <div key={p.id} className="flex flex-col bg-base border border-border-mid rounded-md px-3 py-2 gap-1.5">
            {editId === p.id ? (
              <div className="flex items-center gap-2">
                <input
                  className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 font-sans text-[13px] rounded-sm outline-none flex-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                  autoFocus
                />
                <button onClick={confirmEdit} className="bg-brand text-base border-0 px-3 py-1.5 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm">✓</button>
                <button onClick={() => setEditId(null)} className="bg-transparent text-muted border border-border-strong px-2.5 py-1.5 text-[12px] cursor-pointer rounded-sm font-sans">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-content font-sans">{p.name}</span>

                {/* Badge de vinculación */}
                {p.user_id && (
                  <span className="text-[10px] font-mono text-green bg-[#1a2e1a] border border-[#4af07a44] px-1.5 py-0.5 rounded">
                    ✓ @{p.linked_username}
                  </span>
                )}
                {!p.user_id && p.invitation_status === 'pending' && (
                  <span className="text-[10px] font-mono text-brand/70 flex items-center gap-1">
                    <Clock size={10} /> pendiente
                  </span>
                )}

                {hasMatches(p.id) && (
                  <span className="text-[10px] text-muted font-mono">
                    {tournament.matches.filter(m => [...m.team1, ...m.team2].includes(p.id)).length}P
                  </span>
                )}

                {isOwner && (
                  <>
                    {/* Botón invitar: solo si no está vinculado y no hay invitación pendiente */}
                    {isLoggedIn && !p.user_id && !p.invitation_status && (
                      <div
                        onClick={() => openInvite(p.id)}
                        title="Invitar usuario registrado"
                        className="bg-transparent border-0 text-muted cursor-pointer px-1.5 py-0.5 hover:text-brand transition-colors"
                      >
                        <UserPlus size={14} />
                      </div>
                    )}
                    {/* Cancelar invitación pendiente */}
                    {p.invitation_status === 'pending' && (
                      <div
                        onClick={() => cancelInvite(p)}
                        title="Cancelar invitación"
                        className="bg-transparent border-0 text-muted cursor-pointer px-1.5 py-0.5 hover:text-danger transition-colors"
                      >
                        <X size={14} />
                      </div>
                    )}
                    <div onClick={() => startEdit(p)} className="bg-transparent border-0 text-muted cursor-pointer text-[12px] font-sans px-1.5 py-0.5">
                      <Pencil size={15} />
                    </div>
                    <div onClick={() => setDeleteTarget(p)} className="bg-transparent border-0 text-danger cursor-pointer text-[12px] font-sans px-1.5 py-0.5">
                      <Trash2 size={15} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Panel de envío de invitación */}
            {inviteState[p.id]?.open && (
              <div className="flex flex-col gap-2 pt-1 border-t border-border-mid mt-1">
                <div className="text-[11px] text-muted font-mono">
                  Invitar a @usuario o email a reclamar el slot de <span className="text-content">{p.name}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-surface border border-border-mid text-white px-3 py-2 font-sans text-[13px] rounded-sm outline-none"
                    placeholder="@usuario o email"
                    value={inviteState[p.id]?.identifier ?? ''}
                    onChange={e => setInviteState(s => ({ ...s, [p.id]: { ...s[p.id], identifier: e.target.value } }))}
                    onKeyDown={e => e.key === 'Enter' && sendInvite(p)}
                    autoFocus
                  />
                  <button
                    onClick={() => sendInvite(p)}
                    disabled={inviteState[p.id]?.sending}
                    className="bg-brand text-base border-0 px-4 py-2 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm disabled:opacity-50"
                  >
                    Invitar
                  </button>
                  <button
                    onClick={() => closeInvite(p.id)}
                    className="bg-transparent border border-border-strong text-muted px-3 py-2 text-[12px] cursor-pointer rounded-sm"
                  >
                    ✕
                  </button>
                </div>
                {inviteState[p.id]?.error && (
                  <div className="text-[11px] text-danger font-mono">{inviteState[p.id].error}</div>
                )}
              </div>
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
