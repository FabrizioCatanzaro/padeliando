import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { api } from '../../utils/api';
import { adaptTournament, fmt } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Loader from '../Loader/Loader';
import { useParams } from 'react-router-dom';
import { Trash2, Pencil, Globe, Lock, ChevronLeft, Plus, Trophy } from 'lucide-react';
import FadeInCard from '../shared/FadeInCard';
import { HistoricalStats } from '../Stats/Stats';

export default function GroupView() {
  const {groupId} = useParams();
  const [group,   setGroup]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [editName, setEditName]         = useState("");
  const [editDesc, setEditDesc]         = useState("");
  const [allTournaments, setAllTournaments] = useState([]);
  const navigate = useNavigate();

  async function handleAllTournaments(){
    try{
      const data = await api.groups.history(groupId)
      setAllTournaments(data.map(adaptTournament));
    } finally{
      // finally
    }
  }
  useEffect(() => {
    api.groups.get(groupId).then(setGroup).finally(() => setLoading(false));
    handleAllTournaments()
  }, [groupId]);


  const { user } = useAuth();
  if (loading) return <Loader />;
  if (!group)  return null;

  const isOwner = !!user && String(group.user_id) === String(user.id);

  async function handleDelete() {
    await api.groups.delete(groupId);
    navigate("/");
  }

  async function handleTogglePublic() {
    const updated = await api.groups.update(groupId, { is_public: !group.is_public });
    setGroup({ ...group, is_public: updated.is_public });
  }

  async function handleSaveGroup() {
    const updated = await api.groups.update(groupId, { name: editName.trim(), description: editDesc.trim() });
    setGroup({ ...group, name: updated.name ?? editName.trim(), description: updated.description ?? editDesc.trim() });
    setEditingGroup(false);
  }
  return (
    <div className="bg-base text-content font-sans pb-15">
      <div className="px-6 pt-6 pb-5 flex justify-between items-start flex-wrap gap-3 border-b border-border">
        <div className="flex-1 min-w-0">
          <div onClick={() => navigate('/')} className="flex flex-row gap-2 items-center w-fit bg-transparent text-muted border border-border-strong px-3 py-1.5 text-[12px] cursor-pointer rounded-sm font-sans mb-3">
            <ChevronLeft size={15} />
            <span>Volver</span>
          </div>
          {editingGroup ? (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-surface border border-border-mid text-white px-2.5 py-1 font-condensed font-bold text-[24px] tracking-wide rounded-sm outline-none"
              />
              <input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Descripción (opcional)"
                className="bg-surface border border-border-mid text-white px-2.5 py-1 font-sans text-[13px] rounded-sm outline-none"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveGroup} className="bg-brand text-base border-0 px-3 py-1 font-condensed font-bold text-[12px] cursor-pointer rounded-sm">✓ Guardar</button>
                <button onClick={() => setEditingGroup(false)} className="bg-transparent text-muted border border-border-strong px-3 py-1 font-condensed text-[12px] cursor-pointer rounded-sm">✕ Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="font-condensed font-bold text-[28px] text-white tracking-wide">{group.name}</div>
              </div>
              <div className="font-condensed text-[14px] text-gray-500 tracking-wide">{group.description}</div>
            </>
          )}
        </div>
        {isOwner ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div onClick={handleTogglePublic}
              className={`bg-transparent border px-3 py-2 text-[12px] cursor-pointer rounded-sm font-sans ${group.is_public ? 'text-cyan border-cyan/27 hover:bg-cyan hover:text-gray-800' : 'text-yellow-400 border-border-strong hover:bg-yellow-400 hover:text-gray-800'}`}>
              {group.is_public ? (
                <div className='flex flex-row items-center justify-between gap-2'>
                  <Globe size={15}/>
                  <span>{`Público`}</span>
                </div>
              ): (
                <div className='flex flex-row items-center justify-between gap-2'>
                  <Lock size={15}/>
                  <span> Privado</span>
                </div>
              )}
            </div>
            <div className="bg-transparent border border-[#333] px-3 py-2 text-danger hover:bg-red-600 hover:text-gray-300 cursor-pointer rounded-sm" onClick={() => setDeleteModal(true)}>
              <Trash2 size={15}/> 
            </div>
            <div onClick={() => { setEditName(group.name); setEditDesc(group.description ?? ""); setEditingGroup(true); }} className="bg-transparent border border-[#333] px-3 py-2 cursor-pointer text-yellow-200 rounded-sm font-sans hover:bg-yellow-200 hover:text-gray-700">
              <Pencil size={15}/>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: '#444', fontFamily: "'Kode Mono',monospace" }}>
            Dueño: <span className='hover:text-white underline cursor-pointer' onClick={() => navigate(`/u/${group.owner_username}`)}>@{group.owner_username ?? '—'}</span>
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-4">JORNADAS</div>
        {(!group.tournaments || group.tournaments.length === 0) && !isOwner && (
          <div className="text-center text-dim py-10 px-5 font-sans leading-loose">No hay jornadas todavía.<br/>¡Creá el primero!</div>
        )}
        <div className="flex flex-col gap-2.5 mb-10">
          {isOwner && (
            <div
              onClick={() => navigate(`/groups/${groupId}/tournament/new`)}
              className={`border-dashed border-brand border-2 rounded-sm p-2 cursor-pointer flex flex-col items-center justify-center min-h-full transition-[background] duration-200 hover:border-solid hover:bg-surface`}
            >
              <Plus className='text-brand' size={20} />
              <span className='font-condensed font-bold text-xl text-brand tracking-wide'>NUEVA JORNADA</span>
            </div>
          )}
          {group.tournaments?.map((t, i) => (
            <FadeInCard key={t.id} delay={i * 60}
              className="border border-border-mid rounded-lg px-5 py-4.5 cursor-pointer hover:border-border-strong transition-colors"
              style={{ background: 'linear-gradient(145deg, #111827 0%, #0d1120 100%)' }}
              onClick={() => { navigate(`/groups/${groupId}/tournament/${t.id}`); }}>
              <div className="flex justify-between items-center">
                <div className="font-condensed font-bold text-[18px] text-white">{t.name}</div>
                <span className={`text-[11px] font-mono ${t.status === 'active' ? 'text-green' : 'text-muted'}`}>
                  {t.status === 'active' ? 'EN CURSO' : 'FINALIZADO'}
                </span>
              </div>
              <div className="text-[11px] text-dim font-mono mt-1">
                {fmt(t.created_at)} · {t.match_count} partidos
              </div>
              {t.status === 'finished' && t.winner_label && (
                <div className="flex items-center gap-2 text-[12px] text-brand font-mono mt-1.5">
                  <Trophy size={13} /> {t.winner_label}
                </div>
              )}
            </FadeInCard>
          ))}
        </div>
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted my-5 py-4 border-t border-border">ESTADÍSTICAS HISTÓRICAS</div>
        <HistoricalStats tournaments={allTournaments} showJornadas={false} />
      </div>

      {deleteModal && (
        <Modal
          title={`¿Eliminar "${group.name}"?`}
          message="Se eliminarán el torneo y todas sus jornadas. Los jugadores quedan en la base de datos."
          confirmText="Sí, eliminar"
          confirmDanger
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal(false)}
        />
      )}
    </div>
  );
}
