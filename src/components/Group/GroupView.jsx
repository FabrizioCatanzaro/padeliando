/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import Modal from '../shared/Modal';
import MapPicker from '../shared/MapPicker';
import { api } from '../../utils/api';
import { adaptTournament, fmt } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Loader from '../Loader/Loader';
import { useParams } from 'react-router-dom';
import { Trash2, Pencil, Globe, Lock, ChevronLeft, Plus, Trophy, MapPin, Smile, Check, X, Loader2 } from 'lucide-react';
import FadeInCard from '../shared/FadeInCard';
import { HistoricalStats } from '../Stats/Stats';
import PremiumModal from '../shared/PremiumModal';

const EMOJI_LIST = ['🔥','⚡','🚻','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🎲','🔝','🚨','🌹','🌼','🥑','🍺','🍷','🧉','🍕','❄️','❤️‍🩹','💫','☢️','💸','🗿','♂️','♀️','🪄','🎉','👑']

export default function GroupView() {
  const { groupId } = useParams();
  const [group,   setGroup]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal,      setDeleteModal]      = useState(false);
  const [editingGroup,     setEditingGroup]     = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [allTournaments, setAllTournaments] = useState([]);

  // edit fields
  const [editName,     setEditName]     = useState('');
  const [editDesc,     setEditDesc]     = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editEmojis,   setEditEmojis]   = useState([]);
  const [editLocation, setEditLocation] = useState('');
  const [editPlaceId,  setEditPlaceId]  = useState('');
  const [editLat,      setEditLat]      = useState(null);
  const [editLon,      setEditLon]      = useState(null);

  // location autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationLoading,     setLocationLoading]     = useState(false);
  const locationAbortRef = useRef(null);

  // modals
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showMapPicker,  setShowMapPicker]  = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleAllTournaments() {
    try {
      const data = await api.groups.history(groupId);
      setAllTournaments(data.map(adaptTournament));
    } finally {
      //
    }
  }

  useEffect(() => {
    api.groups.get(groupId).then(setGroup).finally(() => setLoading(false));
    handleAllTournaments();
  }, [groupId]);

  // Photon autocomplete
  useEffect(() => {
    if (!editingGroup || !editLocation.trim() || editLocation.length < 2 || editPlaceId || editLat !== null) {
      setLocationSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      locationAbortRef.current?.abort();
      const controller = new AbortController();
      locationAbortRef.current = controller;
      setLocationLoading(true);
      const params = new URLSearchParams({ q: editLocation, limit: 5 });
      fetch(`https://photon.komoot.io/api/?${params}`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => setLocationSuggestions(data.features ?? []))
        .catch(() => {})
        .finally(() => setLocationLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [editLocation, editPlaceId, editLat, editingGroup]);

  function selectPlace(feature) {
    const p = feature.properties;
    const [fLon, fLat] = feature.geometry.coordinates;
    const parts = [p.name, p.street, p.city, p.state].filter(Boolean);
    setEditLocation([...new Set(parts)].join(', '));
    setEditPlaceId(`${p.osm_type}:${p.osm_id}`);
    setEditLat(fLat);
    setEditLon(fLon);
    setLocationSuggestions([]);
  }

  function handleMapConfirm(pickedLat, pickedLon, displayName) {
    setEditLat(pickedLat);
    setEditLon(pickedLon);
    if (displayName) setEditLocation(displayName);
    setEditPlaceId('');
    setLocationSuggestions([]);
    setShowMapPicker(false);
  }

  function toggleEmoji(e) {
    setEditEmojis(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : prev.length < 2 ? [...prev, e] : prev
    );
  }

  function startEdit() {
    setEditName(group.name);
    setEditDesc(group.description ?? '');
    setEditIsPublic(group.is_public);
    setEditEmojis(group.emojis ?? []);
    setEditLocation(group.location_name ?? '');
    setEditPlaceId(group.place_id ?? '');
    setEditLat(group.lat ?? null);
    setEditLon(group.lon ?? null);
    setEditingGroup(true);
  }

  async function handleSaveGroup() {
    const updated = await api.groups.update(groupId, {
      name:          editName.trim(),
      description:   editDesc.trim(),
      is_public:     editIsPublic,
      emojis:        editEmojis,
      location_name: editLocation || null,
      place_id:      editPlaceId || null,
      lat:           editLat ?? null,
      lon:           editLon ?? null,
    });
    setGroup(prev => ({ ...prev, ...updated }));
    setEditingGroup(false);
  }

  if (loading) return <Loader />;
  if (!group)  return null;

  const isOwner = !!user && String(group.user_id) === String(user.id);

  if (!group.is_public && !isOwner) {
    return (
      <div className="bg-base text-content font-sans min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <Lock size={36} className="text-yellow-400" />
        <div className="text-center">
          <div className="font-condensed font-bold text-2xl text-white tracking-wide mb-1">Categoría privada</div>
          <div className="text-muted text-sm">Solo el dueño puede ver esta categoría.</div>
        </div>
        <div
          onClick={() => navigate('/')}
          className="flex flex-row gap-2 items-center w-fit bg-transparent text-muted border border-border-strong px-3 py-1.5 text-[12px] cursor-pointer rounded-sm font-sans mt-2"
        >
          <ChevronLeft size={15} />
          <span>Volver al inicio</span>
        </div>
      </div>
    );
  }

  async function handleDelete() {
    await api.groups.delete(groupId);
    navigate('/');
  }

  return (
    <div className="bg-base text-content font-sans pb-15">
      <div className="px-6 pt-6 pb-5 flex flex-col gap-3 border-b border-border">
        <div className="flex justify-between items-center">
          <div onClick={() => navigate('/')} className="flex flex-row gap-2 items-center w-fit bg-transparent text-muted border border-border-strong px-3 py-1.5 text-[12px] cursor-pointer rounded-sm font-sans">
            <ChevronLeft size={15} />
            <span>Volver</span>
          </div>

          {isOwner && !editingGroup && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs ${group.is_public ? 'text-cyan' : 'text-yellow-400'}`}>
                {group.is_public ?
                  <div className='flex flex-row items-center justify-between gap-2'>
                    <Globe size={15}/>
                    <span>{`Público`}</span>
                  </div>
                  :
                  <div className='flex flex-row items-center justify-between gap-2'>
                    <Lock size={15}/>
                    <span> Privado</span>
                  </div>
                  }
              </span>
              <div className="bg-transparent border border-[#333] px-3 py-2 text-danger hover:bg-red-600 hover:text-gray-300 cursor-pointer rounded-sm" onClick={() => setDeleteModal(true)}>
                <Trash2 size={15} />
              </div>
              <div onClick={startEdit} className="bg-transparent border border-[#333] px-3 py-2 cursor-pointer text-yellow-200 rounded-sm font-sans hover:bg-yellow-200 hover:text-gray-700">
                <Pencil size={15} />
              </div>
            </div>
          )}

          {!isOwner && (
            <span style={{ fontSize: 11, color: '#444', fontFamily: "'Kode Mono',monospace" }}>
              Dueño: <span className='hover:text-white underline cursor-pointer' onClick={() => navigate(`/u/${group.owner_username}`)}>@{group.owner_username ?? '—'}</span>
            </span>
          )}
        </div>

        <div className="min-w-0">
          {editingGroup ? (
            <div className="flex flex-col gap-4">
              {/* Nombre */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">NOMBRE</label>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={30}
                  className="w-full bg-surface border border-border-mid text-white px-2.5 py-1.5 font-condensed font-bold text-[22px] tracking-wide rounded-sm outline-none"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">DESCRIPCIÓN (opcional)</label>
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Descripción (opcional)"
                  className="w-full bg-surface border border-border-mid text-white px-2.5 py-1.5 font-sans text-[13px] rounded-sm outline-none"
                />
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">LUGAR / CLUB (opcional)</label>
                <div className="relative">
                  {locationLoading
                    ? <Loader2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none animate-spin" />
                    : <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
                  }
                  <input
                    className="w-full bg-surface border border-border-mid text-white pl-7 pr-20 py-2 rounded-sm text-sm outline-none font-sans"
                    placeholder="ej: Padel Club Palermo..."
                    value={editLocation}
                    onChange={(e) => { setEditLocation(e.target.value); setEditPlaceId(''); setEditLat(null); setEditLon(null); }}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-colors cursor-pointer bg-transparent ${editLat ? 'border-brand text-brand' : 'border-border-mid text-[#555] hover:border-border-strong hover:text-white'}`}
                  >
                    <MapPin size={10} />
                    {editLat ? 'PIN ✓' : 'MAPA'}
                  </button>
                  {locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 border border-border-mid border-t-0 rounded-b overflow-hidden" style={{ background: '#111827' }}>
                      {locationSuggestions.map((f, i) => {
                        const p = f.properties;
                        const primary = p.name || p.street || '';
                        const secondary = [p.city, p.state].filter(Boolean).join(', ');
                        return (
                          <div key={i}
                            onMouseDown={(e) => { e.preventDefault(); selectPlace(f); }}
                            className="flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-border-mid last:border-0 hover:bg-surface transition-colors"
                          >
                            <MapPin size={11} className="text-[#444] mt-0.5 shrink-0" />
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
              </div>

              {/* Privacidad */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">PRIVACIDAD</label>
                <div className="flex gap-2">
                  {[{ val: true, label: 'Público', icon: Globe }, { val: false, label: 'Privado', icon: Lock }].map(v => (
                    <div key={String(v.val)} onClick={() => setEditIsPublic(v.val)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs rounded cursor-pointer border transition-colors bg-transparent ${
                        editIsPublic === v.val
                          ? v.val ? 'border-cyan text-cyan' : 'border-yellow-400 text-yellow-400'
                          : 'border-border-strong text-[#555]'
                      }`}>
                      <v.icon size={13} />{v.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Íconos */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">ÍCONOS (opcional · máx. 2)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setShowEmojiModal(true)}
                    className="flex items-center gap-2 bg-transparent border border-border-mid text-[#888] hover:border-border-strong hover:text-white transition-colors px-3 py-2 rounded text-xs font-mono cursor-pointer">
                    <Smile size={13} />
                    ÍCONOS
                    {editEmojis.length > 0 && <span className="text-brand font-bold">({editEmojis.length}/2)</span>}
                  </button>
                  {editEmojis.length > 0 && (
                    <div className="flex gap-1.5 items-center">
                      {editEmojis.map(e => <span key={e} className="text-xl leading-none">{e}</span>)}
                      <button type="button" onClick={() => setEditEmojis([])}
                        className="ml-1 text-[#555] hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveGroup}
                  className="bg-brand text-base border-0 px-4 py-2 font-condensed font-bold text-[13px] cursor-pointer rounded-sm tracking-wide">
                  ✓ GUARDAR
                </button>
                <button onClick={() => setEditingGroup(false)}
                  className="bg-transparent text-muted border border-border-strong px-4 py-2 font-condensed text-[13px] cursor-pointer rounded-sm">
                  ✕ CANCELAR
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {group.emojis?.length > 0 && <span className="text-2xl leading-none">{group.emojis.join(' ')}</span>}
                <div className="font-condensed font-bold text-[28px] text-white tracking-wide">{group.name}</div>
              </div>
              {group.description && (
                <div className="font-condensed text-[14px] text-gray-500 tracking-wide mt-0.5">{group.description}</div>
              )}
              {group.location_name && (
                <div className="flex items-center gap-1 font-mono text-xs text-gray-600 mt-1.5">
                  <MapPin size={11} />
                  <span className="truncate">{group.location_name}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-4">TORNEOS</div>
        {(!group.tournaments || group.tournaments.length === 0) && !isOwner && (
          <div className="text-center text-dim py-10 px-5 font-sans leading-loose">No hay torneos todavía.<br/>¡Creá el primero!</div>
        )}
        <div className="flex flex-col gap-2.5 mb-10">
          {isOwner && (
            <div
              onClick={() => {
                if (user?.subscription?.plan !== 'premium') {
                  const now = new Date();
                  const thisMonthCount = (group.tournaments ?? []).filter(t => {
                    const d = new Date(t.created_at);
                    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
                  }).length;
                  if (thisMonthCount >= 2) {
                    setShowPremiumModal(true);
                    return;
                  }
                }
                navigate(`/cat/${groupId}/torneo/new`);
              }}
              className="border-dashed border-brand border-2 rounded-sm p-2 cursor-pointer flex flex-col items-center justify-center min-h-full transition-[background] duration-200 hover:border-solid hover:bg-surface"
            >
              <Plus className='text-brand' size={20} />
              <span className='font-condensed font-bold text-xl text-brand tracking-wide'>NUEVO TORNEO</span>
            </div>
          )}
          {group.tournaments?.map((t, i) => (
            <FadeInCard key={t.id} delay={i * 60}
              className="border border-border-mid rounded-lg px-5 py-4.5 cursor-pointer hover:border-border-strong transition-colors"
              style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #222222 100%)' }}
              onClick={() => { navigate(`/cat/${groupId}/torneo/${t.id}`); }}>
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
        <HistoricalStats tournaments={allTournaments} showTorneos={false} ownerIsPremium={group.owner_is_premium ?? false} />
      </div>

      {/* Modal mapa */}
      {showMapPicker && (
        <MapPicker
          initialLat={editLat}
          initialLon={editLon}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* Modal emojis */}
      {showEmojiModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEmojiModal(false); }}>
          <div className="bg-surface border border-border-mid rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-[11px] text-[#555] tracking-widest">ÍCONOS · máx. 2</div>
              <button type="button" onClick={() => setShowEmojiModal(false)}
                className="bg-transparent border-none text-[#555] hover:text-white cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {EMOJI_LIST.map(e => (
                <button key={e} type="button" onClick={() => toggleEmoji(e)}
                  className={`relative text-xl p-2 rounded border transition-all cursor-pointer bg-transparent ${
                    editEmojis.includes(e)
                      ? 'border-brand scale-110'
                      : editEmojis.length >= 2
                        ? 'border-transparent opacity-30 cursor-not-allowed'
                        : 'border-transparent opacity-60 hover:opacity-100 hover:border-border-strong'
                  }`}>
                  {e}
                  {editEmojis.includes(e) && (
                    <span className="absolute -top-1 -right-1 bg-brand rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      <Check size={8} strokeWidth={3} className="text-base" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setShowEmojiModal(false)}
              style={{ width: '100%', background: '#e8f04a', color: '#0a0e1a', border: 'none', padding: '12px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: 2, borderRadius: 4, cursor: 'pointer' }}>
              CONFIRMAR
            </button>
          </div>
        </div>
      )}

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}

      {deleteModal && (
        <Modal
          title={`¿Eliminar "${group.name}"?`}
          message="Se eliminará la categoría y todos sus torneos. Los jugadores quedan en la base de datos."
          confirmText="Sí, eliminar"
          confirmDanger
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal(false)}
        />
      )}
    </div>
  );
}
