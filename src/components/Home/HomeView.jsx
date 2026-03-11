import { useState, useEffect } from 'react';
import S, { FONTS } from '../../styles/theme';
import { api } from '../../utils/api';
import Loader from '../Loader/Loader';
 
export default function HomeView() {
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [name,    setName]    = useState('');
  const [desc,    setDesc]    = useState('');
  const [showNew, setShowNew] = useState(false);
 
  useEffect(() => {
    api.groups.list().then(setGroups).finally(() => setLoading(false));
  }, []);
 
  async function handleCreate() {
    if (!name.trim()) return;
    const g = await api.groups.create({ name: name.trim(), description: desc });
    window.location.hash = `/groups/${g.id}`;
  }
 
  if (loading) return <Loader />;
 
  return (
    <div style={S.page}>
      <style>{FONTS}</style>
      <div style={S.header}>
        <div style={S.logo}>🎾 PADEL<span style={{ color: '#e8f04a' }}>EANDO</span></div>
        <button onClick={() => setShowNew(!showNew)} style={S.primaryBtn}>
          {showNew ? 'Cancelar' : '+ Nuevo grupo'}
        </button>
      </div>
 
      <div style={S.content}>
        {showNew && (
          <div style={{ ...S.manageSection, marginBottom: 24 }}>
            <label style={S.label}>NOMBRE DEL GRUPO</label>
            <input style={S.input} placeholder='ej: Club Genesis - Martes'
              value={name} onChange={(e) => setName(e.target.value)} />
            <label style={S.label}>DESCRIPCIÓN (opcional)</label>
            <input style={S.input} placeholder='ej: Martes 20 a 22hs'
              value={desc} onChange={(e) => setDesc(e.target.value)} />
            <button onClick={handleCreate}
              style={{ ...S.createBtn, opacity: name.trim() ? 1 : 0.4 }}>
              CREAR GRUPO DE JUEGO
            </button>
          </div>
        )}
 
        <div style={S.sectionTitle}>TUS GRUPOS</div>
        {groups.length === 0 && (
          <div style={S.empty}>No hay grupos todavía.<br/>Creá el primero.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          {groups.map((g) => (
            <div key={g.id} style={S.groupCard}
              onClick={() => { window.location.hash = `/groups/${g.id}`; }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
                            fontSize: 20, color: '#fff', marginBottom: 6 }}>
                {g.name}
              </div>
              {g.description && (
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{g.description}</div>
              )}
              <div style={{ fontSize: 11, color: '#444', fontFamily: "'Courier New',monospace" }}>
                {g.player_count} jugadores · {g.tournament_count} torneos
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
