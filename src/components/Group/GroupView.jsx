import { useState, useEffect } from 'react';
import S, { FONTS } from '../../styles/theme';
import Modal from '../shared/Modal';
import { api } from '../../utils/api';
import { fmt } from '../../utils/helpers';
import Loader from '../Loader/Loader';
 
export default function GroupView({ groupId }) {
  const [group,   setGroup]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
 
  useEffect(() => {
    api.groups.get(groupId).then(setGroup).finally(() => setLoading(false));
  }, [groupId]);
 
  if (loading) return <Loader />;
  if (!group)  return null;

  async function handleDelete() {
    await api.groups.delete(groupId);
    window.location.hash = "/";
  }
 
  return (
    <div style={S.page}>
      <style>{FONTS}</style>
      <div style={S.header}>
        <div>
          <div style={{...S.logo, cursor: "pointer"}} onClick={() => { window.location.hash = "/"; }}>
            🎾 PADEL<span style={{ color: '#e8f04a' }}>EANDO</span>
          </div>
          <div style={S.tourneyName}>{group.name}</div>
        </div>
        <button
          onClick={() => { window.location.hash = `/groups/${groupId}/tournament/new`; }}
          style={S.primaryBtn}>
          + Nuevo torneo
        </button>
        <button onClick={() => setDeleteModal(true)} style={S.dangerBtn}>🗑️</button>
      </div>
 
      <div style={S.content}>
        <div style={S.sectionTitle}>JORNADAS</div>
        {(!group.tournaments || group.tournaments.length === 0) && (
          <div style={S.empty}>No hay jornadas todavía.<br/>¡Creá el primero!</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {group.tournaments?.map((t) => (
            <div key={t.id} style={S.groupCard}
              onClick={() => { window.location.hash = `/groups/${groupId}/tournament/${t.id}`; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
                              fontSize: 18, color: '#fff' }}>
                  {t.name}
                </div>
                <span style={{ fontSize: 11, color: t.status==='active'?'#4af07a':'#555',
                               fontFamily: "'Courier New',monospace" }}>
                  {t.status === 'active' ? 'EN CURSO' : 'FINALIZADO'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#444', fontFamily: "'Courier New',monospace", marginTop: 4 }}>
                {fmt(t.created_at)} · {t.match_count} partidos
              </div>
            </div>
          ))}
        </div>
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
