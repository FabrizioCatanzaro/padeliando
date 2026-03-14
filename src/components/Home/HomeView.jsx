/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../../context/useAuth'
import { SkeletonGrid } from '../shared/Skeleton'

export default function HomeView() {
  const [groups,       setGroups]       = useState([]);
  const [partGroups,   setPartGroups]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [name,         setName]         = useState('');
  const [desc,         setDesc]         = useState('');
  const [isPublic,     setIsPublic]     = useState(true);
  const [showNew,      setShowNew]      = useState(false);
  const [searchQ,      setSearchQ]      = useState('');
  const [searchRes,    setSearchRes]    = useState([]);
  const [searching,    setSearching]    = useState(false);

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    Promise.all([api.groups.list(), api.groups.participating()])
      .then(([owned, part]) => { setGroups(owned); setPartGroups(part); })
      .catch(() => { navigate('/login'); })
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
    navigate(`/groups/${g.id}`);
  }

  if (loading) return <SkeletonGrid count={6}/>;

  return (
    <div className="min-h-screen bg-base text-[#ccc] font-[Barlow] pb-16">
      <div className="px-6 py-6">
        {/* Buscador de perfiles */}
        <div style={{ marginBottom: 28, position: 'relative' }}>
          <input
            className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]"
            placeholder="🔍 Buscar perfiles por nombre o @usuario..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          {searchQ.trim().length >= 2 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                          background: '#111827', border: '1px solid #2a3040', borderTop: 'none',
                          borderRadius: '0 0 4px 4px', maxHeight: 200, overflowY: 'auto' }}>
              {searching && (
                <div style={{ padding: '10px 14px', fontSize: 12, color: '#555',
                  fontFamily: "'Courier New',monospace" }}>buscando...</div>
              )}
              {!searching && searchRes.length === 0 && (
                <div style={{ padding: '10px 14px', fontSize: 12, color: '#555',
                  fontFamily: "'Courier New',monospace" }}>Sin resultados...</div>
              )}
              {searchRes.map((u) => (
                <div key={u.id}
                  onClick={() => { navigate(`/u/${u.username}`); setSearchQ(''); setSearchRes([]); }}
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
        {isLoggedIn && showNew && (
          <div className="bg-surface border border-border-mid rounded-lg p-4 mb-4">
            <label style={{display: "block", fontSize: 11, letterSpacing: 2, color: "#555", fontFamily: "'Courier New', monospace", marginBottom: 8, marginTop: 20}}>NOMBRE DEL TORNEO</label>
            <input className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]" placeholder="ej: Club Genesis - Martes"
              value={name} onChange={(e) => setName(e.target.value)} />
            <label style={{display: "block", fontSize: 11, letterSpacing: 2, color: "#555", fontFamily: "'Courier New', monospace", marginBottom: 8, marginTop: 20}}>DESCRIPCIÓN (opcional)</label>
            <input className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]" placeholder="ej: Martes 20 a 22hs"
              value={desc} onChange={(e) => setDesc(e.target.value)} />

            {/* Visibilidad */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {[{ val: true, label: '🌐 Público' }, { val: false, label: '🔒 Privado' }].map(({ val, label }) => (
                <button key={String(val)} onClick={() => setIsPublic(val)} style={{
                  borderColor: isPublic === val ? '#e8f04a' : '#2a3040',
                  color:       isPublic === val ? '#e8f04a' : '#555',
                }} className="bg-transparent text-[#555] border border-border-strong px-3 py-2 text-xs rounded cursor-pointer">
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
              style={{ width: "100%", background: "#e8f04a", color: "#0a0e1a", border: "none", padding: "14px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: 2, borderRadius: 4, marginTop: 28, transition: "opacity 0.2s", cursor: "pointer", opacity: name.trim() ? 1 : 0.4 }}>
              CREAR TORNEO
            </button>
          </div>
        )}

        {/* Lista de torneos */}
        {isLoggedIn ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <div className="font-[Barlow_Condensed] font-bold text-sm tracking-[3px] text-[#555]">TUS TORNEOS</div>
            </div>
            {groups.length === 0 && !showNew && (
              <div className="text-center text-[#444] py-10 px-5 leading-loose">No hay torneos todavía.<br />Creá el primero.</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {/* Botón Nuevo Torneo como primera card */}
              <div
                onClick={() => setShowNew(!showNew)}
                className={`${showNew ? 'bg-#b8c032' : '#0d1120'} border-dashed border-brand border-2 rounded-sm p-2 cursor-pointer flex flex-col items-center justify-center min-h-full transition-[background] duration-200 hover:border-solid hover:bg-surface`}
              >
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: '#e8f04a', lineHeight: 1 }}>
                  {showNew ? '×' : '+'}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#e8f04a', letterSpacing: 3, marginTop: 4 }}>
                  {showNew ? 'CANCELAR' : 'NUEVO TORNEO'}
                </div>
              </div>
              {groups.map((g) => (
                <div key={g.id} className="bg-surface border border-border-mid rounded-lg p-5 cursor-pointer hover:border-border-strong transition-colors"
                  onClick={() => { navigate(`/groups/${g.id}`); }}>
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

            {/* Grupos en los que participo (invitación aceptada, no soy dueño) */}
            {partGroups.length > 0 && (
              <>
                <div style={{ marginTop: 36, marginBottom: 16 }}>
                  <div className="font-[Barlow_Condensed] font-bold text-sm tracking-[3px] text-[#555]">TORNEOS EN LOS QUE PARTICIPO</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                  {partGroups.map((g) => (
                    <div key={g.id} className="bg-surface border border-border-mid rounded-lg p-5 cursor-pointer hover:border-border-strong transition-colors"
                      onClick={() => { navigate(`/groups/${g.id}`); }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 6 }}>
                          {g.name}
                        </div>
                        <span style={{ fontSize: 10, color: '#4af07a44', fontFamily: "'Courier New',monospace", border: '1px solid #4af07a22', padding: '2px 5px', borderRadius: 3 }}>
                          jugador
                        </span>
                      </div>
                      {g.description && (
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{g.description}</div>
                      )}
                      <div style={{ fontSize: 11, color: '#444', fontFamily: "'Courier New',monospace" }}>
                        {g.player_count} jugadores · {g.tournament_count} jornadas
                      </div>
                      {g.owner_username && (
                        <div style={{ fontSize: 10, color: '#333', fontFamily: "'Courier New',monospace", marginTop: 4 }}>
                          @{g.owner_username}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center text-[#444] py-10 px-5 leading-loose">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
            <div style={{ color: '#aaa', marginBottom: 8 }}>
              Registrate para guardar tus torneos y compartirlos.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => { navigate('/login'); }}className="bg-transparent text-[#555] border border-border-strong px-3 py-2 text-xs rounded cursor-pointer">
                Ingresar
              </button>
              <button onClick={() => { navigate('/register'); }} className="bg-brand text-base font-[Barlow_Condensed] font-bold text-sm tracking-widest px-5 py-2.5 rounded cursor-pointer whitespace-nowrap">
                Registrarse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}