import { useState, useEffect } from 'react';
import S, { FONTS } from '../../styles/theme';
import { api } from '../../utils/api';
import { getUser, isLoggedIn, clearSession } from '../../utils/auth';
import Loader from '../Loader/Loader';

export default function HomeView() {
  const [groups,       setGroups]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [name,         setName]         = useState('');
  const [desc,         setDesc]         = useState('');
  const [isPublic,     setIsPublic]     = useState(true);
  const [showNew,      setShowNew]      = useState(false);
  const [searchQ,      setSearchQ]      = useState('');
  const [searchRes,    setSearchRes]    = useState([]);
  const [searching,    setSearching]    = useState(false);

  const user = getUser();
  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (!loggedIn) { setLoading(false); return; }
    api.groups.list()
      .then(setGroups)
      .catch(() => { clearSession(); window.location.hash = '/login'; })
      .finally(() => setLoading(false));
  }, []);

  // Búsqueda de perfiles con debounce
  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setSearchRes([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setSearchRes(await api.auth.search(searchQ)); }
      catch { setSearchRes([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  async function handleCreate() {
    if (!name.trim()) return;
    const g = await api.groups.create({ name: name.trim(), description: desc, is_public: isPublic });
    window.location.hash = `/groups/${g.id}`;
  }

  if (loading) return <Loader />;

  return (
    <div style={S.page}>
      <style>{FONTS}</style>
      <div style={S.header}>
        <div style={{ ...S.logo, cursor: 'pointer' }}
          onClick={() => { window.location.hash = '/'; }}>
          🎾 PADEL<span style={{ color: '#e8f04a' }}>EANDO</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {loggedIn ? (
            <>
              <span
                onClick={() => { window.location.hash = `/u/${user?.username}`; }}
                style={{
                  fontSize: 13, color: '#555', fontFamily: "'Courier New',monospace",
                  cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                @{user?.username}
              </span>
              <button onClick={() => setShowNew(!showNew)} style={S.primaryBtn}>
                {showNew ? 'Cancelar' : '+ Nuevo torneo'}
              </button>
              <button onClick={() => { clearSession(); window.location.reload(); }}
                style={S.resetBtn}>
                Salir
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { window.location.hash = '/login'; }} style={S.resetBtn}>
                Ingresar
              </button>
              <button onClick={() => { window.location.hash = '/register'; }} style={S.primaryBtn}>
                Registrarse
              </button>
            </>
          )}
        </div>
      </div>

      <div style={S.content}>
        {/* Buscador de perfiles */}
        <div style={{ marginBottom: 28, position: 'relative' }}>
          <input
            style={{ ...S.input, marginBottom: 0 }}
            placeholder="🔍 Buscar perfiles por nombre o @usuario..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          {(searchRes.length > 0 || searching) && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                          background: '#111827', border: '1px solid #2a3040', borderTop: 'none',
                          borderRadius: '0 0 4px 4px', maxHeight: 200, overflowY: 'auto' }}>
              {searching && (
                <div style={{ padding: '10px 14px', fontSize: 12, color: '#555',
                               fontFamily: "'Courier New',monospace" }}>buscando...</div>
              )}
              {searchRes.map((u) => (
                <div key={u.id}
                  onClick={() => { window.location.hash = `/u/${u.username}`; setSearchQ(''); setSearchRes([]); }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #1a2030' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1a2030'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ color: '#fff', fontFamily: "'Barlow Condensed',sans-serif",
                                 fontWeight: 700, fontSize: 16 }}>
                    {u.name}
                  </div>
                  <div style={{ color: '#555', fontSize: 11, fontFamily: "'Courier New',monospace" }}>
                    @{u.username}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario nuevo torneo */}
        {loggedIn && showNew && (
          <div style={{ ...S.manageSection, marginBottom: 24 }}>
            <label style={S.label}>NOMBRE DEL TORNEO</label>
            <input style={S.input} placeholder="ej: Club Genesis - Martes"
              value={name} onChange={(e) => setName(e.target.value)} />
            <label style={S.label}>DESCRIPCIÓN (opcional)</label>
            <input style={S.input} placeholder="ej: Martes 20 a 22hs"
              value={desc} onChange={(e) => setDesc(e.target.value)} />

            {/* Visibilidad */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {[{ val: true, label: '🌐 Público' }, { val: false, label: '🔒 Privado' }].map(({ val, label }) => (
                <button key={String(val)} onClick={() => setIsPublic(val)} style={{
                  ...S.resetBtn,
                  borderColor: isPublic === val ? '#e8f04a' : '#2a3040',
                  color:       isPublic === val ? '#e8f04a' : '#555',
                }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#444', fontFamily: "'Courier New',monospace", marginTop: 6 }}>
              {isPublic
                ? 'Cualquiera puede ver este torneo en tu perfil.'
                : 'Solo vos podés ver este torneo.'}
            </div>

            <button onClick={handleCreate}
              style={{ ...S.createBtn, opacity: name.trim() ? 1 : 0.4 }}>
              CREAR TORNEO
            </button>
          </div>
        )}

        {/* Lista de torneos */}
        {loggedIn ? (
          <>
            <div style={S.sectionTitle}>TUS TORNEOS</div>
            {groups.length === 0 && (
              <div style={S.empty}>No hay torneos todavía.<br />Creá el primero.</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {groups.map((g) => (
                <div key={g.id} style={S.groupCard}
                  onClick={() => { window.location.hash = `/groups/${g.id}`; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
                                  fontSize: 20, color: '#fff', marginBottom: 6 }}>
                      {g.name}
                    </div>
                    <span style={{ fontSize: 10, color: g.is_public ? '#4af0c8' : '#555',
                                   fontFamily: "'Courier New',monospace" }}>
                      {g.is_public ? '🌐' : '🔒'}
                    </span>
                  </div>
                  {g.description && (
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{g.description}</div>
                  )}
                  <div style={{ fontSize: 11, color: '#444', fontFamily: "'Courier New',monospace" }}>
                    {g.player_count} jugadores · {g.tournament_count} jornadas
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={S.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
            <div style={{ color: '#aaa', marginBottom: 8 }}>
              Registrate para guardar tus torneos y compartirlos.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => { window.location.hash = '/login'; }} style={S.resetBtn}>
                Ingresar
              </button>
              <button onClick={() => { window.location.hash = '/register'; }} style={S.primaryBtn}>
                Registrarse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}