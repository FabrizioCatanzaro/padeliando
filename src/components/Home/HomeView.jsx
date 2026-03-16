/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../../context/useAuth'
import { Globe, Lock, Plus, X } from 'lucide-react';
import logoUrl from '../../assets/padeleando.ico'
import FadeInCard from '../shared/FadeInCard'
import Loader from '../Loader/Loader';

const EMOJI_LIST = ['🔥','⚡','🚻','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🎲','🔝','🚨','🌹','🌼','🥑','🍺','🍷','🧉','🍕','🥚','🍆','💸','🗿','♂️','♀️','🪄','🧑🏼‍🎄','🎉','👑']

export default function HomeView() {
  const [groups,       setGroups]       = useState([]);
  const [partGroups,   setPartGroups]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [name,         setName]         = useState('');
  const [desc,         setDesc]         = useState('');
  const [isPublic,     setIsPublic]     = useState(true);
  const [showNew,      setShowNew]      = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const [searchQ,      setSearchQ]      = useState('');
  const [searchRes,    setSearchRes]    = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [error,     setError]     = useState(null)

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const valsPrivacy = [
    { val: true, label: 'Público', icon: Globe },
    { val: false, label: 'Privado', icon: Lock }
  ]

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

  function toggleEmoji(e) {
    setSelectedEmojis(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : prev.length < 2 ? [...prev, e] : prev
    )
  }

  async function handleCreate() {
    try {
      if (!name.trim()) return;
      const g = await api.groups.create({ name: name.trim(), description: desc, is_public: isPublic, emojis: selectedEmojis });
      navigate(`/groups/${g.id}`);
    } catch (e){
      setError(e.message)
    } 
  }

  if (loading) return <Loader />;

  return (
    <div className="bg-base text-[#ccc] font-[Barlow] pb-16">
      <div className="px-6 py-6">
        {/* Buscador de perfiles */}
        <div style={{ marginBottom: 28, position: 'relative' }}>
          <input
            className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-sans"
            placeholder="🔍 Buscar perfiles por nombre o @usuario..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          {searchQ.trim().length >= 2 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                          background: '#111827', border: '1px solid #2a3040', borderTop: 'none',
                          borderRadius: '0 0 4px 4px', maxHeight: 200, overflowY: 'auto' }}>
              {searching && (
                <div className='font-mono px-4 py-2 text-xs text-gray-500' >buscando...</div>
              )}
              {!searching && searchRes.length === 0 && (
                <div className='font-mono px-4 py-2 text-xs text-gray-500' >Sin resultados...</div>
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
                  <div style={{ color: '#555', fontSize: 11, fontFamily: "'Kode Mono',monospace" }}>
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
            <label style={{display: "block", fontSize: 11, letterSpacing: 2, color: "#555", fontFamily: "'Kode Mono', monospace", marginBottom: 8, marginTop: 20}}>NOMBRE DEL TORNEO</label>
            <input className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]" placeholder="ej: C7/C8"
              value={name} onChange={(e) => setName(e.target.value)} maxLength={30} minLength={2}/>
            <label style={{display: "block", fontSize: 11, letterSpacing: 2, color: "#555", fontFamily: "'Kode Mono', monospace", marginBottom: 8, marginTop: 20}}>DESCRIPCIÓN (opcional)</label>
            <input className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]" placeholder="ej: Todos los martes a las 17..."
              value={desc} onChange={(e) => setDesc(e.target.value)} />

            {/* Visibilidad */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {valsPrivacy.map((v) => (
                <div key={String(v.val)} onClick={() => setIsPublic(v.val)} className={`flex flex-row gap-2 items-center bg-transparent text-[#555] border border-border-strong px-3 py-2 text-xs rounded cursor-pointer ${isPublic === v.val ? 'border-cyan text-cyan' : 'border-strong'} ${!isPublic && !v.val && 'text-yellow-400 border-yellow-400'}`}>
                  <v.icon size={15} />{v.label}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#444', fontFamily: "'Kode Mono',monospace", marginTop: 6 }}>
              {isPublic
                ? 'Cualquiera puede ver este torneo en tu perfil.'
                : 'Solo vos podés ver este torneo.'}
            </div>

            <label style={{display: "block", fontSize: 11, letterSpacing: 2, color: "#555", fontFamily: "'Kode Mono', monospace", marginBottom: 8, marginTop: 20}}>ÍCONOS (opcional · máx. 2)</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_LIST.map(e => (
                <button key={e} onClick={() => toggleEmoji(e)}
                  className={`text-lg p-1.5 rounded border transition-all cursor-pointer bg-transparent ${selectedEmojis.includes(e) ? 'border-brand scale-110' : 'border-transparent opacity-50 hover:opacity-100 hover:border-border-strong'}`}
                >
                  {e}
                </button>
              ))}
            </div>

            {error && <p className="text-danger text-xs font-mono mt-2">{error}</p>}
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
              <div className="font-[Barlow_Condensed] font-bold text-sm tracking-[3px] text-[#555]">MIS TORNEOS</div>
            </div>
            {groups.length === 0 && !showNew && (
              <div className="text-center text-[#444] py-10 px-5 leading-loose">No hay torneos todavía.<br />Creá el primero.</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {/* Botón Nuevo Torneo como primera card */}
              <div
                onClick={() => { setShowNew(v => !v); setSelectedEmojis([]); }}
                className={`${showNew ? 'bg-#b8c032' : '#0d1120'} border-dashed border-brand border-2 rounded-sm p-2 cursor-pointer flex flex-col items-center justify-center min-h-full transition-[background] duration-200 hover:border-solid hover:bg-surface`}
              >
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: '#e8f04a', lineHeight: 1 }}>
                  {showNew ? <X size={28} /> : <Plus size={28} />}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#e8f04a', letterSpacing: 3, marginTop: 4 }}>
                  {showNew ? 'CANCELAR' : 'NUEVO TORNEO'}
                </div>
              </div>
              {groups.map((g, i) => (
                <FadeInCard key={g.id} delay={i * 60}
                  className="border border-border-mid rounded-lg cursor-pointer hover:border-border-strong transition-colors overflow-hidden"
                  style={{ background: 'linear-gradient(145deg, #111827 0%, #0d1120 100%)' }}
                  onClick={() => { navigate(`/groups/${g.id}`); }}>
                  {g.emojis?.length > 0 && (
                    <div className="inline-flex px-3 pt-2 pb-1.5 text-base bg-surface border-b border-r border-border-mid rounded-br-lg leading-none">
                      {g.emojis.join(' ')}
                    </div>
                  )}
                  <div className="p-5">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className={`font-condensed font-bold text-xl text-white mb-4`}>
                        {g.name}
                      </div>
                      <span className={`text-xs ${g.is_public ? 'text-cyan' : 'text-yellow-400'}`}>
                        {g.is_public ? <Globe size={15} /> : <Lock size={15}/>}
                      </span>
                    </div>
                    {g.description && (
                      <div className='font-sans text-sm text-gray-400 mb-2'>{g.description}</div>
                    )}
                    <div className='font-mono text-xs text-gray-600' >
                      {g.player_count} jugadores · {g.tournament_count} {g.tournament_count > 1 ? 'jornadas' : 'jornada'}
                    </div>
                  </div>
                </FadeInCard>
              ))}
            </div>

            {/* Grupos en los que participo (invitación aceptada, no soy dueño) */}
            {partGroups.length > 0 && (
              <>
                <div style={{ marginTop: 36, marginBottom: 16 }}>
                  <div className="font-condensed font-bold text-sm tracking-[3px] text-[#555]">TORNEOS EN LOS QUE PARTICIPO</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                  {partGroups.map((g, i) => (
                    <FadeInCard key={g.id} delay={i * 60}
                      className="border border-border-mid rounded-lg cursor-pointer hover:border-border-strong transition-colors overflow-hidden"
                      style={{ background: 'linear-gradient(145deg, #111827 0%, #0d1120 100%)' }}
                      onClick={() => { navigate(`/groups/${g.id}`); }}>
                      {g.emojis?.length > 0 && (
                        <div className="inline-flex px-3 pt-2 pb-1.5 text-base border-b border-r border-border-mid rounded-br-lg leading-none">
                          {g.emojis.join(' ')}
                        </div>
                      )}
                      <div className="p-5">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className='font-condensed text-xl font-bold text-white mb-4'>
                            {g.name}
                          </div>
                          <span className='text-xs text-green-700 font-mono border-solid border border-[#4af07a22] rounded-lg px-5 py-2'>
                            jugador
                          </span>
                        </div>
                        {g.description && (
                          <div className='font-sans text-sm text-gray-400 mb-2' >{g.description}</div>
                        )}
                        <div className='font-mono text-xs text-gray-600'>
                          {g.player_count} jugadores · {g.tournament_count} {g.tournament_count > 1 ? 'jornadas' : 'jornada'}
                        </div>
                        {g.owner_username && (
                          <div className='font-mono text-xs text-gray-600 mt-2' >
                            @{g.owner_username}
                          </div>
                        )}
                      </div>
                    </FadeInCard>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center text-[#444] py-10 px-5 leading-loose">
            <div className='flex flex-col items-center justify-center'>
              <img className='max-w-30 my-4' src={logoUrl}/>
            </div>
            <div style={{ color: '#aaa', marginBottom: 8 }}>
              Registrate para guardar tus torneos y compartirlos.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => { navigate('/login'); }} className="bg-brand text-base font-[Barlow_Condensed] font-bold text-sm tracking-widest px-5 py-2.5 rounded cursor-pointer whitespace-nowrap">
                Iniciar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}