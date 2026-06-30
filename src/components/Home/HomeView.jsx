/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../../context/useAuth'
import { Globe, Lock, Plus, X, Search, MapPin, Smile, Check, Loader2 } from 'lucide-react';
import logoUrl from '../../assets/padeleando.ico'
import FadeInCard from '../shared/FadeInCard'
import GroupCard from '../shared/GroupCard'
import { Skeleton, CardSkeleton } from '../shared/Skeleton';
import MapPicker from '../shared/MapPicker';
import PremiumModal from '../shared/PremiumModal';
import { useToast } from '../../context/useToast';
import Btn from '../shared/Btn';

const EMOJI_LIST = ['🔥','⚡','🚻','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🎲','🔝','🚨','🌹','🌼','🥑','🍺','🍷','🧉','🍕','❄️','❤️‍🩹','💫','☢️','💸','🗿','♂️','♀️','🪄','🎉','👑']

const NEARBY_CACHE_KEY = 'nearby_v1';
const NEARBY_TTL       = 10 * 60 * 1000; // 10 min
const NEARBY_INITIAL   = 3;
const NEARBY_PAGE_SIZE = 5;

function readNearbyCache() {
  try {
    const raw = localStorage.getItem(NEARBY_CACHE_KEY);
    if (!raw) return null;
    const { groups, ts } = JSON.parse(raw);
    if (Date.now() - ts > NEARBY_TTL) { localStorage.removeItem(NEARBY_CACHE_KEY); return null; }
    return groups;
  } catch { return null; }
}

function writeNearbyCache(groups) {
  try { localStorage.setItem(NEARBY_CACHE_KEY, JSON.stringify({ groups, ts: Date.now() })); } catch {
    /* */
  }
}


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
  const [error,             setError]             = useState(null)
  const [showPremiumModal,  setShowPremiumModal]  = useState(false)
  const [creating,          setCreating]          = useState(false)

  const [nearbyGroups,   setNearbyGroups]   = useState([]);
  const [nearbyStatus,   setNearbyStatus]   = useState('idle'); // idle | loading | done | denied | error
  const [nearbyPage,     setNearbyPage]     = useState(NEARBY_INITIAL);

  const { isLoggedIn, user } = useAuth();
  const { showToast } = useToast();
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

  useEffect(() => {
    const cached = readNearbyCache();
    if (cached) { setNearbyGroups(cached); setNearbyStatus('done'); }
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
    const cached = readNearbyCache();
    if (cached) {
      setNearbyGroups(cached);
      setNearbyStatus('done');
      setNearbyPage(NEARBY_INITIAL);
      return;
    }
    if (!navigator.geolocation) { setNearbyStatus('error'); return; }
    setNearbyStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const data = await api.groups.nearby(coords.latitude, coords.longitude);
          writeNearbyCache(data);
          setNearbyGroups(data);
          setNearbyStatus('done');
          setNearbyPage(NEARBY_INITIAL);
        } catch {
          setNearbyStatus('error');
        }
      },
      () => setNearbyStatus('denied'),
      { timeout: 8000 }
    );
  }

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
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
      showToast('Categoría creada');
      navigate(`/cat/${g.id}`);
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  }

  function openNewModal() {
    if (user?.subscription?.plan !== 'premium' && groups.length >= 2) {
      setShowPremiumModal(true);
      return;
    }
    setName('');
    setDesc('');
    setIsPublic(true);
    setSelectedEmojis([]);
    setLocation('');
    setPlaceId('');
    setLat(null);
    setLon(null);
    setError(null);
    setShowNew(true);
  }

  if (loading) return (
    <div className="bg-base text-content font-sans pb-16">
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <Skeleton className="h-11 w-full rounded-lg mb-8" />
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </div>
      </div>
    </div>
  );

  const ownGroupIds = new Set(groups.map(g => g.id));
  const nearbyVisible = nearbyGroups.filter(g => !ownGroupIds.has(g.id));

  return (
    <div className="bg-base text-content font-sans pb-16">
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">

        {/* ── Buscador ── */}
        <div className="relative mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                className="w-full bg-surface border border-border-mid text-white pl-10 pr-4 py-3 rounded-lg text-sm outline-none font-sans placeholder:text-muted focus:border-border-strong transition-colors"
                placeholder="Buscar jugadores o categorías..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchQ.trim().length < 2 || committing}
              className="bg-surface border border-border-mid text-white px-4 py-3 rounded-lg cursor-pointer hover:border-border-strong transition-colors disabled:opacity-30"
            >
              {committing ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>

          {/* Dropdown de sugerencias */}
          {searchQ.trim().length >= 2 && (searching || searchUsers.length > 0 || searchGroups.length > 0) && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-surface-alt border border-border-strong rounded-lg overflow-hidden shadow-xl max-h-72 overflow-y-auto">
              {searching && (
                <div className="px-4 py-3 text-xs font-mono text-muted">Buscando...</div>
              )}
              {!searching && searchUsers.length === 0 && searchGroups.length === 0 && (
                <div className="px-4 py-3 text-xs font-mono text-muted">Sin resultados</div>
              )}
              {!searching && searchUsers.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-mono text-dim tracking-widest border-b border-border-mid">PERFILES</div>
                  {searchUsers.map((u) => (
                    <div key={u.id}
                      onClick={() => { navigate(`/u/${u.username}`); setSearchQ(''); setSearchUsers([]); setSearchGroups([]); }}
                      className="flex flex-col px-4 py-2.5 cursor-pointer border-b border-border-mid last:border-0 hover:bg-surface transition-colors"
                    >
                      <span className="font-condensed font-bold text-base text-white">{u.name}</span>
                      <span className="text-[11px] font-mono text-dim">@{u.username}</span>
                    </div>
                  ))}
                </>
              )}
              {!searching && searchGroups.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-mono text-dim tracking-widest border-b border-border-mid">CATEGORÍAS</div>
                  {searchGroups.map((g) => (
                    <div key={g.id}
                      onClick={() => { navigate(`/cat/${g.id}`); setSearchQ(''); setSearchUsers([]); setSearchGroups([]); }}
                      className="flex flex-col px-4 py-2.5 cursor-pointer border-b border-border-mid last:border-0 hover:bg-surface transition-colors"
                    >
                      <span className="font-condensed font-bold text-base text-white">
                        {g.emojis?.length > 0 && <span className="mr-1">{g.emojis.join(' ')}</span>}{g.name}
                      </span>
                      <span className="text-[11px] font-mono text-dim">@{g.owner_username}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Cerca de vos ── */}
        {!committedQ && (
          <div className="mb-8">
            {nearbyStatus === 'idle' && (
              <button
                onClick={handleNearby}
                className="flex items-center gap-2 bg-transparent border border-border-mid text-muted px-3.5 py-2 rounded-lg text-xs font-mono cursor-pointer hover:border-border-strong hover:text-soft transition-colors"
              >
                <MapPin size={13} />
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
              <div className="text-xs font-mono text-dim">Permiso de ubicación denegado.</div>
            )}
            {nearbyStatus === 'error' && (
              <div className="text-xs font-mono text-dim">No se pudo obtener la ubicación.</div>
            )}
            {nearbyStatus === 'done' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-condensed font-bold text-sm tracking-widest text-muted">
                    <MapPin size={13} />
                    CERCA TUYO
                  </div>
                  <button
                    onClick={() => { setNearbyStatus('idle'); setNearbyGroups([]); }}
                    className="text-dim hover:text-soft transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <X size={15} />
                  </button>
                </div>
                {nearbyVisible.length === 0 ? (
                  <div className="font-mono text-xs text-dim">No hay categorías públicas en un radio de 20 km.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 bg-border-strong/10 p-3 rounded-lg">
                      {nearbyVisible.slice(0, nearbyPage).map((g, i) => (
                        <GroupCard key={g.id} g={g} delay={i * 60} onClick={() => navigate(`/cat/${g.id}`)} />
                      ))}
                    </div>
                    {nearbyVisible.length > nearbyPage && (
                      <button
                        onClick={() => setNearbyPage(p => p + NEARBY_PAGE_SIZE)}
                        className="mt-3 flex items-center gap-2 bg-transparent border border-border-mid text-muted px-3.5 py-2 rounded-lg text-xs font-mono cursor-pointer hover:border-border-strong hover:text-soft transition-colors"
                      >
                        VER MÁS · {nearbyVisible.length - nearbyPage} restantes
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Resultados de búsqueda ── */}
        {committedQ && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="font-condensed font-bold text-sm tracking-widest text-muted">
                RESULTADOS PARA &quot;{committedQ}&quot;
              </div>
              <button onClick={clearSearch} className="text-dim hover:text-soft transition-colors cursor-pointer bg-transparent border-none">
                <X size={16} />
              </button>
            </div>
            {committing && <div className="font-mono text-xs text-muted py-4">Buscando...</div>}
            {!committing && committedUsers.length === 0 && committedGroups.length === 0 && (
              <div className="font-mono text-xs text-muted py-4">Sin resultados.</div>
            )}
            {!committing && committedUsers.length > 0 && (
              <>
                <div className="font-mono text-[10px] text-dim tracking-widest mb-3">PERFILES</div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 mb-8">
                  {committedUsers.map((u) => (
                    <FadeInCard key={u.id}
                      className="border border-border-mid rounded-lg cursor-pointer overflow-hidden p-4 card-link"
                      style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #222222 100%)' }}
                      onClick={() => navigate(`/u/${u.username}`)}>
                      <div className="font-condensed font-bold text-xl text-white">{u.name}</div>
                      <div className="font-mono text-xs text-dim mt-1">@{u.username}</div>
                    </FadeInCard>
                  ))}
                </div>
              </>
            )}
            {!committing && committedGroups.length > 0 && (
              <>
                <div className="font-mono text-[10px] text-dim tracking-widest mb-3">CATEGORÍAS</div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 mb-8">
                  {committedGroups.map((g) => (
                    <GroupCard key={g.id} g={g} onClick={() => navigate(`/cat/${g.id}`)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Mis categorías ── */}
        {!committedQ && isLoggedIn && (
          <>
            {/* Header sección + botón nueva categoría */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-condensed font-bold text-sm tracking-widest text-muted">MIS CATEGORÍAS</h2>
              <Btn variant="primary" size="sm" icon={Plus} onClick={openNewModal}>NUEVA</Btn>
            </div>

            {groups.length === 0 ? (
              <div className="border border-dashed border-border-strong rounded-lg p-8 text-center mb-8">
                <p className="text-muted text-sm font-sans mb-4">Todavía no tenés categorías creadas.</p>
                <Btn variant="primary" icon={Plus} onClick={openNewModal}>CREAR PRIMERA CATEGORÍA</Btn>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 mb-10">
                {groups.map((g, i) => (
                  <GroupCard key={g.id} g={g} delay={i * 60} onClick={() => navigate(`/cat/${g.id}`)} />
                ))}
              </div>
            )}

            {/* Grupos en los que participo */}
            {partGroups.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-condensed font-bold text-sm tracking-widest text-muted">PARTICIPANDO EN</h2>
                  <span className="font-mono text-xs text-secondary border border-dim px-2 py-0.5 rounded-full">{partGroups.length}</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                  {partGroups.map((g, i) => (
                    <GroupCard key={g.id} g={g} delay={i * 60} badge="jugador" onClick={() => navigate(`/cat/${g.id}`)} />
                  ))}
                </div>
                
              </>
            )}
          </>
        )}

        {/* ── Estado no logueado ── */}
        {!isLoggedIn && (
          <div className="flex flex-col items-center justify-center text-center py-16 px-5">
            <img className="w-20 mb-6 opacity-15" src={logoUrl} />
            <p className="text-secondary text-sm font-sans mb-6 leading-relaxed">
              Registrate para guardar tus categorías y compartirlas.
            </p>
            <Btn variant="primary" size="lg" onClick={() => navigate('/login')}>INICIAR SESIÓN</Btn>
          </div>
        )}
      </div>

      {/* ── Modal nueva categoría ── */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNew(false); }}
        >
          <div className="bg-surface border border-border-mid rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="sticky top-0 bg-surface border-b border-border-mid px-6 py-4 flex items-center justify-between">
              <h2 className="font-condensed font-bold text-lg text-white tracking-wide">NUEVA CATEGORÍA</h2>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="bg-transparent border-none text-muted hover:text-soft cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-[11px] tracking-widest text-dim font-mono mb-2">NOMBRE DE LA CATEGORÍA</label>
                <input
                  className="w-full bg-surface-alt border border-border-mid text-white px-3.5 py-2.5 rounded-lg text-sm outline-none font-sans focus:border-border-strong transition-colors"
                  placeholder="ej: C7/C8"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={30}
                  minLength={2}
                  autoFocus
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[11px] tracking-widest text-dim font-mono mb-2">DESCRIPCIÓN <span className="text-muted normal-case tracking-normal">(opcional)</span></label>
                <input
                  className="w-full bg-surface-alt border border-border-mid text-white px-3.5 py-2.5 rounded-lg text-sm outline-none font-sans focus:border-border-strong transition-colors"
                  placeholder="ej: Todos los martes a las 17..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              {/* Lugar / Club */}
              <div>
                <label className="block text-[11px] tracking-widest text-dim font-mono mb-2">LUGAR / CLUB <span className="text-muted normal-case tracking-normal">(opcional)</span></label>
                <div className="relative">
                  {locationLoading
                    ? <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none animate-spin" />
                    : <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  }
                  <input
                    className="w-full bg-surface-alt border border-border-mid text-white pl-8 pr-20 py-2.5 rounded-lg text-sm outline-none font-sans focus:border-border-strong transition-colors"
                    placeholder="ej: Padel Club Palermo..."
                    value={location}
                    onChange={(e) => { setLocation(e.target.value); setPlaceId(''); setLat(null); setLon(null); }}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    title="Elegir en el mapa"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-colors cursor-pointer bg-transparent ${lat ? 'border-brand text-brand' : 'border-border-mid text-dim hover:border-border-strong hover:text-soft'}`}
                  >
                    <MapPin size={11} />
                    {lat ? 'PIN ✓' : 'MAPA'}
                  </button>
                  {locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 border border-border-mid border-t-0 rounded-b overflow-hidden bg-surface-alt">
                      {locationSuggestions.map((f, i) => {
                        const p = f.properties;
                        const primary = p.name || p.street || '';
                        const secondary = [p.city, p.state].filter(Boolean).join(', ');
                        return (
                          <div key={i}
                            onMouseDown={(e) => { e.preventDefault(); selectPlace(f); }}
                            className="flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-border-mid last:border-0 hover:bg-surface transition-colors"
                          >
                            <MapPin size={12} className="text-dim mt-1 shrink-0" />
                            <div>
                              <div className="text-sm text-white leading-snug">{primary}</div>
                              {secondary && <div className="text-xs text-dim mt-0.5">{secondary}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Visibilidad */}
              <div>
                <label className="block text-[11px] tracking-widest text-dim font-mono mb-2">VISIBILIDAD</label>
                <div className="flex gap-2">
                  {valsPrivacy.map((v) => (
                    <button
                      key={String(v.val)}
                      type="button"
                      onClick={() => setIsPublic(v.val)}
                      className={`flex items-center gap-2 bg-transparent border px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                        isPublic === v.val
                          ? (v.val ? 'border-cyan text-cyan' : 'border-yellow-400 text-yellow-400')
                          : 'border-border-strong text-muted hover:border-border-mid'
                      }`}
                    >
                      <v.icon size={14} />{v.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-dim font-mono mt-2">
                  {isPublic
                    ? 'Cualquiera puede ver esta categoría en tu perfil.'
                    : 'Solo vos podés ver esta categoría.'}
                </p>
              </div>

              {/* Íconos */}
              <div>
                <label className="block text-[11px] tracking-widest text-dim font-mono mb-2">ÍCONOS <span className="text-muted normal-case tracking-normal">(opcional, máx. 2)</span></label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmojiModal(true)}
                    className="flex items-center gap-2 bg-transparent border border-border-mid text-secondary hover:border-border-strong hover:text-soft transition-colors px-3 py-2 rounded-lg text-xs font-mono cursor-pointer"
                  >
                    <Smile size={14} />
                    ELEGIR ÍCONOS
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
                        className="ml-1 text-dim hover:text-soft transition-colors bg-transparent border-none cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="text-danger text-xs font-mono">{error}</p>}
            </div>

            {/* Footer del modal */}
            <div className="sticky bottom-0 bg-surface border-t border-border-mid px-6 py-4">
              <Btn variant="primary" full size="lg" onClick={handleCreate} disabled={!name.trim()} loading={creating}>
                CREAR CATEGORÍA
              </Btn>
            </div>
          </div>
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
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/75"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEmojiModal(false); }}
        >
          <div className="bg-surface border border-border-mid rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-[11px] text-dim tracking-widest">ÍCONOS · máx. 2</div>
              <button
                type="button"
                onClick={() => setShowEmojiModal(false)}
                className="bg-transparent border-none text-dim hover:text-soft cursor-pointer transition-colors"
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
            <Btn variant="primary" full size="md" onClick={() => setShowEmojiModal(false)}>CONFIRMAR</Btn>
          </div>
        </div>
      )}

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
    </div>
  );
}
