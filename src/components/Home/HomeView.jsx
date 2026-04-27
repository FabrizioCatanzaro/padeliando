/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../../context/useAuth'
import { Globe, Lock, Plus, X, Search, MapPin, Smile, Check, Loader2, Navigation } from 'lucide-react';
import logoUrl from '../../assets/padeleando.ico'
import FadeInCard from '../shared/FadeInCard'
import Loader from '../Loader/Loader';
import MapPicker from '../shared/MapPicker';

const EMOJI_LIST = ['🔥','⚡','🚻','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🎲','🔝','🚨','🌹','🌼','🥑','🍺','🍷','🧉','🍕','❄️','❤️‍🩹','💫','☢️','💸','🗿','♂️','♀️','🪄','🎉','👑']

export default function HomeView() {
  const [groups,       setGroups]       = useState([]);
  const [partGroups,   setPartGroups]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [name,         setName]         = useState('');
  const [desc,         setDesc]         = useState('');
  const [isPublic,     setIsPublic]     = useState(true);
  const [showNew,      setShowNew]      = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [location,           setLocation]           = useState('');
  const [placeId,            setPlaceId]            = useState('');
  const [lat,                setLat]                = useState(null);
  const [lon,                setLon]                = useState(null);
  const [locationSuggestions,setLocationSuggestions] = useState([]);
  const [locationLoading,    setLocationLoading]    = useState(false);
  const [showMapPicker,      setShowMapPicker]      = useState(false);
  const [searchQ,        setSearchQ]        = useState('');
  const [searchUsers,    setSearchUsers]    = useState([]);
  const [searchGroups,   setSearchGroups]   = useState([]);
  const [searching,      setSearching]      = useState(false);
  const [committedQ,     setCommittedQ]     = useState('');
  const [committedUsers, setCommittedUsers] = useState([]);
  const [committedGroups,setCommittedGroups]= useState([]);
  const [committing,     setCommitting]     = useState(false);
  const [error,     setError]     = useState(null)

  const [nearbyGroups,   setNearbyGroups]   = useState([]);
  const [nearbyStatus,   setNearbyStatus]   = useState('idle'); // idle | loading | done | denied | error

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const locationAbortRef = useRef(null);

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

  // Sugerencias de lugar con Photon (OpenStreetMap) — gratis, sin API key
  useEffect(() => {
    if (!location.trim() || location.length < 2 || placeId || lat !== null) {
      setLocationSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      locationAbortRef.current?.abort();
      const controller = new AbortController();
      locationAbortRef.current = controller;
      setLocationLoading(true);
      // bbox de Argentina para sesgar resultados
      const params = new URLSearchParams({ q: location, limit: 5, lat: -34.646194, lon: -58.566583 });
      fetch(`https://photon.komoot.io/api/?${params}`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => setLocationSuggestions(data.features ?? []))
        .catch(() => {})
        .finally(() => setLocationLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [location, placeId, lat]);

  function selectPlace(feature) {
    const p = feature.properties;
    const [fLon, fLat] = feature.geometry.coordinates;
    const parts = [p.name, p.street, p.city, p.state].filter(Boolean);
    const display = [...new Set(parts)].join(', ');
    setLocation(display);
    setPlaceId(`${p.osm_type}:${p.osm_id}`);
    setLat(fLat);
    setLon(fLon);
    setLocationSuggestions([]);
  }

  function handleMapConfirm(pickedLat, pickedLon, displayName) {
    setLat(pickedLat);
    setLon(pickedLon);
    if (displayName) setLocation(displayName);
    setPlaceId('');
    setLocationSuggestions([]);
    setShowMapPicker(false);
  }

  // Búsqueda de perfiles y torneos con debounce
  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setSearchUsers([]); setSearchGroups([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const [users, groups] = await Promise.all([
          api.auth.search(searchQ),
          api.groups.search(searchQ),
        ]);
        setSearchUsers(users);
        setSearchGroups(groups);
      } catch {
        setSearchUsers([]);
        setSearchGroups([]);
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  function toggleEmoji(e) {
    setSelectedEmojis(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : prev.length < 2 ? [...prev, e] : prev
    )
  }

  async function handleSearch() {
    const q = searchQ.trim();
    if (q.length < 2) return;
    setCommitting(true);
    try {
      const [users, groups] = await Promise.all([
        api.auth.search(q),
        api.groups.search(q),
      ]);
      setCommittedQ(q);
      setCommittedUsers(users);
      setCommittedGroups(groups);
      setSearchUsers([]);
      setSearchGroups([]);
    } catch {
      setCommittedUsers([]);
      setCommittedGroups([]);
    } finally { setCommitting(false); }
  }

  function clearSearch() {
    setSearchQ('');
    setCommittedQ('');
    setCommittedUsers([]);
    setCommittedGroups([]);
    setSearchUsers([]);
    setSearchGroups([]);
  }

  function handleNearby() {
    if (!navigator.geolocation) { setNearbyStatus('error'); return; }
    setNearbyStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const data = await api.groups.nearby(coords.latitude, coords.longitude);
          setNearbyGroups(data);
          setNearbyStatus('done');
        } catch {
          setNearbyStatus('error');
        }
      },
      () => setNearbyStatus('denied'),
      { timeout: 8000 }
    );
  }

  async function handleCreate() {
    try {
      if (!name.trim()) return;
      const g = await api.groups.create({
        name: name.trim(),
        description: desc,
        is_public: isPublic,
        emojis: selectedEmojis,
        location_name: location || null,
        place_id: placeId || null,
        lat: lat ?? null,
        lon: lon ?? null,
      });
      navigate(`/cat/${g.id}`);
    } catch (e){
      setError(e.message)
    }
  }

  if (loading) return <Loader />;

  const ownGroupIds = new Set(groups.map(g => g.id));
  const nearbyVisible = nearbyGroups.filter(g => !ownGroupIds.has(g.id));

  return (
    <div className="bg-base text-[#ccc] font-[Barlow] pb-16">
      <div className="px-6 py-6">
        {/* Buscador de perfiles */}
        <div style={{ marginBottom: 28, position: 'relative' }}>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-sans"
              placeholder="Buscar perfiles o categorías..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button
              onClick={handleSearch}
              disabled={searchQ.trim().length < 2 || committing}
              className="bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded cursor-pointer hover:border-border-strong transition-colors disabled:opacity-30"
            >
              <Search size={16} />
            </button>
          </div>
          {searchQ.trim().length >= 2 && (searching || searchUsers.length > 0 || searchGroups.length > 0) && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                          background: '#111827', border: '1px solid #2a3040', borderTop: 'none',
                          borderRadius: '0 0 4px 4px', maxHeight: 300, overflowY: 'auto' }}>
              {searching && (
                <div className='font-mono px-4 py-2 text-xs text-gray-500'>buscando...</div>
              )}
              {!searching && searchUsers.length === 0 && searchGroups.length === 0 && (
                <div className='font-mono px-4 py-2 text-xs text-gray-500'>Sin resultados...</div>
              )}
              {!searching && searchUsers.length > 0 && (
                <>
                  <div className='font-mono px-4 pt-2 pb-1 text-[10px] text-gray-600 tracking-widest'>PERFILES</div>
                  {searchUsers.map((u) => (
                    <div key={u.id}
                      onClick={() => { navigate(`/u/${u.username}`); setSearchQ(''); setSearchUsers([]); setSearchGroups([]); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #1a2030' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#1a2030'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16 }}>
                        {u.name}
                      </div>
                      <div style={{ color: '#555', fontSize: 11, fontFamily: "'Kode Mono',monospace" }}>
                        @{u.username}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {!searching && searchGroups.length > 0 && (
                <>
                  <div className='font-mono px-4 pt-2 pb-1 text-[10px] text-gray-600 tracking-widest'>TORNEOS</div>
                  {searchGroups.map((g) => (
                    <div key={g.id}
                      onClick={() => { navigate(`/cat/${g.id}`); setSearchQ(''); setSearchUsers([]); setSearchGroups([]); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #1a2030' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#1a2030'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16 }}>
                        {g.emojis?.length > 0 && <span className='mr-1'>{g.emojis.join(' ')}</span>}{g.name}
                      </div>
                      <div style={{ color: '#555', fontSize: 11, fontFamily: "'Kode Mono',monospace" }}>
                        @{g.owner_username}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Cerca de vos */}
        {!committedQ && (
          <div className="mb-7">
            {nearbyStatus === 'idle' && (
              <button
                onClick={handleNearby}
                className="flex items-center gap-2 bg-transparent border border-border-mid text-muted px-3.5 py-2 rounded text-xs font-mono cursor-pointer hover:border-border-strong hover:text-white transition-colors"
              >
                <Navigation size={13} />
                BUSCAR CATEGORÍAS CERCA TUYO
              </button>
            )}
            {nearbyStatus === 'loading' && (
              <div className="flex items-center gap-2 text-xs font-mono text-muted">
                <Loader2 size={13} className="animate-spin" />
                Buscando torneos cercanos...
              </div>
            )}
            {nearbyStatus === 'denied' && (
              <div className="text-xs font-mono text-[#555]">Permiso de ubicación denegado.</div>
            )}
            {nearbyStatus === 'error' && (
              <div className="text-xs font-mono text-[#555]">No se pudo obtener la ubicación.</div>
            )}
            {nearbyStatus === 'done' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-condensed font-bold text-sm tracking-[3px] text-[#555] flex items-center gap-2">
                    <Navigation size={13} />
                    CERCA TUYO
                  </div>
                  <button
                    onClick={() => { setNearbyStatus('idle'); setNearbyGroups([]); }}
                    className="text-[#555] hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <X size={15} />
                  </button>
                </div>
                {nearbyVisible.length === 0 ? (
                  <div className="font-mono text-xs text-[#555]">No hay categorías públicas en un radio de 20 km.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                    {nearbyVisible.map((g, i) => (
                      <FadeInCard key={g.id} delay={i * 60}
                        className="border border-border-mid rounded-lg cursor-pointer hover:border-border-strong transition-colors overflow-hidden"
                        style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #222222 100%)' }}
                        onClick={() => navigate(`/cat/${g.id}`)}>
                        {g.emojis?.length > 0 && (
                          <div className="inline-flex px-3 pt-2 pb-1.5 text-base bg-surface border-b border-r border-border-mid rounded-br-lg leading-none">
                            {g.emojis.join(' ')}
                          </div>
                        )}
                        <div className="p-4">
                          <div className="font-condensed font-bold text-xl text-white mb-1">{g.name}</div>
                          <div className="font-mono text-xs text-gray-600 mb-1.5">@{g.owner_username}</div>
                          {g.location_name && (
                            <div className="flex items-center gap-1 font-mono text-xs text-gray-600 mb-1">
                              <MapPin size={10} className="shrink-0" />
                              <span className="truncate">{g.location_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 font-mono text-xs text-brand mt-2">
                            <Navigation size={10} />
                            {g.distance_km} km
                          </div>
                        </div>
                      </FadeInCard>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Formulario nuevo torneo */}
        {isLoggedIn && showNew && (
          <div className="bg-surface border border-border-mid rounded-lg p-4 mb-4">
            <label style={{display: "block", fontSize: 11, letterSpacing: 2, color: "#555", fontFamily: "'Kode Mono', monospace", marginBottom: 8, marginTop: 20}}>NOMBRE DE LA CATEGORÍA</label>
            <input className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]" placeholder="ej: C7/C8"
              value={name} onChange={(e) => setName(e.target.value)} maxLength={30} minLength={2}/>

            <label style={{display: "block", fontSize: 11, letterSpacing: 2, color: "#555", fontFamily: "'Kode Mono', monospace", marginBottom: 8, marginTop: 20}}>DESCRIPCIÓN (opcional)</label>
            <input className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]" placeholder="ej: Todos los martes a las 17..."
              value={desc} onChange={(e) => setDesc(e.target.value)} />

            {/* Lugar / Club */}
            <label style={{display: "block", fontSize: 11, letterSpacing: 2, color: "#555", fontFamily: "'Kode Mono', monospace", marginBottom: 8, marginTop: 20}}>LUGAR / CLUB (opcional)</label>
            <div className="relative">
              {locationLoading
                ? <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none animate-spin" />
                : <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
              }
              <input
                className="w-full bg-surface border border-border-mid text-white pl-8 pr-20 py-2.5 rounded text-sm outline-none font-[Barlow]"
                placeholder="ej: Padel Club Palermo..."
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPlaceId(''); setLat(null); setLon(null); }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                title="Elegir en el mapa"
                className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-colors cursor-pointer bg-transparent ${lat ? 'border-brand text-brand' : 'border-border-mid text-[#555] hover:border-border-strong hover:text-white'}`}
              >
                <MapPin size={11} />
                {lat ? 'PIN ✓' : 'MAPA'}
              </button>
              {locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 border border-border-mid border-t-0 rounded-b overflow-hidden"
                     style={{ background: '#111827' }}>
                  {locationSuggestions.map((f, i) => {
                    const p = f.properties;
                    const primary = p.name || p.street || '';
                    const secondary = [p.city, p.state].filter(Boolean).join(', ');
                    return (
                      <div key={i}
                        onMouseDown={(e) => { e.preventDefault(); selectPlace(f); }}
                        className="flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-border-mid last:border-0 hover:bg-surface transition-colors"
                      >
                        <MapPin size={12} className="text-[#444] mt-1 shrink-0" />
                        <div>
                          <div className="text-sm text-white leading-snug">{primary}</div>
                          {secondary && <div className="text-xs text-[#555] mt-0.5">{secondary}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
                ? 'Cualquiera puede ver esta categoría en tu perfil.'
                : 'Solo vos podés ver esta categoría.'}
            </div>

            {/* Íconos */}
            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowEmojiModal(true)}
                className="flex items-center gap-2 bg-transparent border border-border-mid text-[#888] hover:border-border-strong hover:text-white transition-colors px-3 py-2 rounded text-xs font-mono cursor-pointer"
              >
                <Smile size={14} />
                ÍCONOS
                {selectedEmojis.length > 0 && (
                  <span className="text-brand font-bold">({selectedEmojis.length}/2)</span>
                )}
              </button>
              {selectedEmojis.length > 0 && (
                <div className="flex gap-1.5 items-center">
                  {selectedEmojis.map(e => (
                    <span key={e} className="text-xl leading-none">{e}</span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedEmojis([])}
                    className="ml-1 text-[#555] hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            {error && <p className="text-danger text-xs font-mono mt-2">{error}</p>}
            <button onClick={handleCreate}
              style={{ width: "100%", background: "#e8f04a", color: "#0a0e1a", border: "none", padding: "14px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: 2, borderRadius: 4, marginTop: 28, transition: "opacity 0.2s", cursor: "pointer", opacity: name.trim() ? 1 : 0.4 }}>
              CREAR CATEGORÍA
            </button>
          </div>
        )}

        {/* Modal mapa */}
        {showMapPicker && (
          <MapPicker
            initialLat={lat}
            initialLon={lon}
            onConfirm={handleMapConfirm}
            onClose={() => setShowMapPicker(false)}
          />
        )}

        {/* Modal de selección de íconos */}
        {showEmojiModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowEmojiModal(false); }}
          >
            <div className="bg-surface border border-border-mid rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono text-[11px] text-[#555] tracking-widest">
                  ÍCONOS · máx. 2
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmojiModal(false)}
                  className="bg-transparent border-none text-[#555] hover:text-white cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                {EMOJI_LIST.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => toggleEmoji(e)}
                    className={`relative text-xl p-2 rounded border transition-all cursor-pointer bg-transparent ${
                      selectedEmojis.includes(e)
                        ? 'border-brand scale-110'
                        : selectedEmojis.length >= 2
                          ? 'border-transparent opacity-30 cursor-not-allowed'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:border-border-strong'
                    }`}
                  >
                    {e}
                    {selectedEmojis.includes(e) && (
                      <span className="absolute -top-1 -right-1 bg-brand rounded-full w-3.5 h-3.5 flex items-center justify-center">
                        <Check size={8} strokeWidth={3} className="text-base" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowEmojiModal(false)}
                style={{ width: '100%', background: '#e8f04a', color: '#0a0e1a', border: 'none', padding: '12px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: 2, borderRadius: 4, cursor: 'pointer' }}
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        )}

        {/* Resultados de búsqueda */}
        {committedQ && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="font-condensed font-bold text-sm tracking-[3px] text-[#555]">
                RESULTADOS PARA &quot;{committedQ}&quot;
              </div>
              <button onClick={clearSearch} className="text-[#555] hover:text-white transition-colors cursor-pointer bg-transparent border-none">
                <X size={16} />
              </button>
            </div>
            {committing && <div className="font-mono text-xs text-gray-500 py-4">buscando...</div>}
            {!committing && committedUsers.length === 0 && committedGroups.length === 0 && (
              <div className="font-mono text-xs text-gray-500 py-4">Sin resultados.</div>
            )}
            {!committing && committedUsers.length > 0 && (
              <>
                <div className="font-mono text-[10px] text-gray-600 tracking-widest mb-2">PERFILES</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12, marginBottom: 24 }}>
                  {committedUsers.map((u) => (
                    <FadeInCard key={u.id}
                      className="border border-border-mid rounded-lg cursor-pointer hover:border-border-strong transition-colors overflow-hidden p-4"
                      style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #222222 100%)' }}
                      onClick={() => navigate(`/u/${u.username}`)}>
                      <div className="font-condensed font-bold text-xl text-white">{u.name}</div>
                      <div className="font-mono text-xs text-gray-600 mt-1">@{u.username}</div>
                    </FadeInCard>
                  ))}
                </div>
              </>
            )}
            {!committing && committedGroups.length > 0 && (
              <>
                <div className="font-mono text-[10px] text-gray-600 tracking-widest mb-2">TORNEOS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12, marginBottom: 24 }}>
                  {committedGroups.map((g) => (
                    <FadeInCard key={g.id}
                      className="border border-border-mid rounded-lg cursor-pointer hover:border-border-strong transition-colors overflow-hidden"
                      style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #222222 100%)' }}
                      onClick={() => navigate(`/cat/${g.id}`)}>
                      {g.emojis?.length > 0 && (
                        <div className="inline-flex px-3 pt-2 pb-1.5 text-base bg-surface border-b border-r border-border-mid rounded-br-lg leading-none">
                          {g.emojis.join(' ')}
                        </div>
                      )}
                      <div className="p-4">
                        <div className="font-condensed font-bold text-xl text-white mb-1">{g.name}</div>
                        <div className="font-mono text-xs text-gray-600">@{g.owner_username}</div>
                      </div>
                    </FadeInCard>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Lista de torneos */}
        {!committedQ && isLoggedIn && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div className="font-[Barlow_Condensed] font-bold text-sm tracking-[3px] text-[#555]">MIS CATEGORÍAS</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {/* Botón Nuevo Torneo como primera card */}
              <div
                onClick={() => { setShowNew(v => !v); setSelectedEmojis([]); setLocation(''); setPlaceId(''); setLat(null); setLon(null); }}
                className={`${showNew ? 'bg-#b8c032' : '#0d1120'} border-dashed border-brand border-2 rounded-sm p-2 cursor-pointer flex flex-col items-center justify-center min-h-full transition-[background] duration-200 hover:border-solid hover:bg-surface`}
              >
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: '#e8f04a', lineHeight: 1 }}>
                  {showNew ? <X size={28} /> : <Plus size={28} />}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#e8f04a', letterSpacing: 3, marginTop: 4 }}>
                  {showNew ? 'CANCELAR' : 'NUEVA CATEGORÍA'}
                </div>
              </div>
              {groups.map((g, i) => (
                <FadeInCard key={g.id} delay={i * 60}
                  className="border border-border-mid rounded-lg cursor-pointer hover:border-border-strong transition-colors overflow-hidden"
                  style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #222222 100%)' }}
                  onClick={() => { navigate(`/cat/${g.id}`); }}>
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
                    {g.location_name && (
                      <div className='flex items-center gap-1 font-mono text-xs text-gray-600 mb-2 min-w-0'>
                        <MapPin size={10} className="shrink-0" />
                        <span className='truncate'>{g.location_name}</span>
                      </div>
                    )}
                    <div className='font-mono text-xs text-gray-600' >
                      {g.player_count} jugadores · {g.tournament_count} {g.tournament_count > 1 ? 'torneos' : 'torneo'}
                    </div>
                  </div>
                </FadeInCard>
              ))}
            </div>

            {/* Grupos en los que participo (invitación aceptada, no soy dueño) */}
            {partGroups.length > 0 && (
              <>
                <div style={{ marginTop: 36, marginBottom: 16 }}>
                  <div className="font-condensed font-bold text-sm tracking-[3px] text-[#555]">CATEGORÍAS EN LAS QUE PARTICIPO</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                  {partGroups.map((g, i) => (
                    <FadeInCard key={g.id} delay={i * 60}
                      className="border border-border-mid rounded-lg cursor-pointer hover:border-border-strong transition-colors overflow-hidden"
                      style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #222222 100%)' }}
                      onClick={() => { navigate(`/cat/${g.id}`); }}>
                      <div className='flex justify-between'>
                        {g.emojis?.length > 0 && (
                          <div className="inline-flex px-3 pt-2 pb-1.5 text-base border-b border-r border-border-mid rounded-br-lg leading-none">
                            {g.emojis.join(' ')}
                          </div>
                        )}
                          <span className='inline-flex px-3 pt-2 pb-1.5 border-b border-l border-border-mid rounded-bl-lg leading-none text-xs text-green-700 font-mono py-2'>
                            jugador
                          </span>
                      </div>
                      <div className="p-5">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className='font-condensed text-2xl font-bold text-white mb-2'>
                            {g.name}
                          </div>
                        </div>
                        {g.description && (
                          <div className='font-sans text-sm text-gray-400 mb-2' >{g.description}</div>
                        )}
                        {g.location_name && (
                          <div className='flex items-center gap-1 font-mono text-xs text-gray-600 mb-2'>
                            <MapPin size={10} />
                            {g.location_name}
                          </div>
                        )}
                        <div className='font-mono text-xs text-gray-600'>
                          {g.player_count} jugadores · {g.tournament_count} {g.tournament_count > 1 ? 'torneos' : 'torneo'}
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
        )}

        {!isLoggedIn && (
          <div className="text-center text-[#444] py-10 px-5 leading-loose">
            <div className='flex flex-col items-center justify-center'>
              <img className='max-w-30 my-4 opacity-20' src={logoUrl}/>
            </div>
            <div style={{ color: '#aaa', marginBottom: 8 }}>
              Registrate para guardar tus categorías y compartirlas.
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
