/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { api } from '../../utils/api';
import { adaptTournament, fmt, tournamentDisplayStatus, TOURNAMENT_STATUS_META } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/useToast';
import { useParams } from 'react-router-dom';
import { Trash2, Pencil, Globe, Lock, ChevronLeft, Plus, Trophy, Smile, Check, X, Users, User, Flame, User2, Building2, Share2 } from 'lucide-react';
import Btn from '../shared/Btn';
import Badge from '../shared/Badge';
import { Skeleton, CardSkeleton } from '../shared/Skeleton';
import FadeInCard from '../shared/FadeInCard';
import { HistoricalStats } from '../Stats/Stats';
import PremiumModal from '../shared/PremiumModal';

const EMOJI_LIST = ['🔥','⚡','🚻','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🎲','🔝','🚨','🌹','🌼','🥑','🍺','🍷','🧉','🍕','❄️','❤️‍🩹','💫','☢️','💸','🗿','♂️','♀️','🪄','🎉','👑']

export default function GroupView() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [deleteModal,      setDeleteModal]      = useState(false);
  const [deleteInput,      setDeleteInput]      = useState('');
  const [editingGroup,     setEditingGroup]     = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [allTournaments, setAllTournaments] = useState([]);
  const [copied,           setCopied]           = useState(false);
  const [visibleCount,     setVisibleCount]     = useState(5);

  // edit fields
  const [editName,     setEditName]     = useState('');
  const [editDesc,     setEditDesc]     = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editEmojis,   setEditEmojis]   = useState([]);

  // modals
  const [showEmojiModal, setShowEmojiModal] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  async function handleAllTournaments() {
    try {
      const data = await api.groups.history(groupId);
      setAllTournaments(data.map(adaptTournament));
    } finally {
      //
    }
  }

  useEffect(() => {
    api.groups.get(groupId).then(setGroup);
    handleAllTournaments();
    setVisibleCount(5);
  }, [groupId]);

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
    setEditingGroup(true);
  }

  async function copyLink() {
    const shareLink = `${window.location.origin}/cat/${groupId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: group.name,
          text: `¡Mirá la categoría "${group.name}" en Padeleando!`,
          url: shareLink,
        });
      } catch { /* usuario canceló */ }
    } else {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      showToast('Enlace copiado');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSaveGroup() {
    setSaving(true);
    try {
      const updated = await api.groups.update(groupId, {
        name:          editName.trim(),
        description:   editDesc.trim(),
        is_public:     editIsPublic,
        emojis:        editEmojis,
      });
      setGroup(prev => ({ ...prev, ...updated }));
      setEditingGroup(false);
      showToast('Categoría guardada');
    } finally {
      setSaving(false);
    }
  }

  if (!group) return (
    <div className="bg-base text-content font-sans pb-15">
      <div className="px-6 pt-6 pb-5 border-b border-border flex flex-col gap-3">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="flex flex-col gap-3">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>
      </div>
    </div>
  );

  const isOwner = !!user && String(group.user_id) === String(user.id);

  if (!group.is_public && !isOwner) {
    return (
      <div className="bg-base text-content font-sans min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <Lock size={36} className="text-yellow-400" />
        <div className="text-center">
          <div className="font-condensed font-bold text-2xl text-white tracking-wide mb-1">Categoría privada</div>
          <div className="text-muted text-sm">Solo el dueño puede ver esta categoría.</div>
        </div>
        <Btn size="sm" icon={ChevronLeft} onClick={() => navigate('/')} className="mt-2">Volver al inicio</Btn>
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
          <Btn size="sm" icon={ChevronLeft} onClick={() => navigate('/')}>Volver</Btn>

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
              {group.is_public && (
                <Btn size="sm" icon={copied ? Check : Share2} onClick={copyLink} />
              )}
              <Btn variant="danger" size="sm" icon={Trash2} onClick={() => { setDeleteModal(true); setDeleteInput(''); }} />
              <Btn size="sm" icon={Pencil} onClick={startEdit} />
            </div>
          )}

          {!isOwner && (
            <div className="flex items-center gap-2">
              <Btn size="sm" icon={copied ? Check : Share2} onClick={copyLink} />
              <span className="flex gap-2 items-center border border-border-strong rounded px-2 py-1 hover:bg-border-mid hover:text-white cursor-pointer transition-colors" onClick={() => navigate(`/u/${group.owner_username}`)}>
                <User2 className="text-content" size={13}/><span className='text-sm text-content font-mono'>@{group.owner_username ?? '—'}</span>
              </span>
            </div>
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
                  maxLength={50}
                  className="w-full bg-surface border border-border-mid text-white px-2.5 py-1.5 font-sans text-[13px] rounded-sm outline-none"
                />
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
                <Btn variant="primary" size="sm" icon={Check} onClick={handleSaveGroup} loading={saving}>GUARDAR</Btn>
                <Btn size="sm" icon={X} onClick={() => setEditingGroup(false)}>CANCELAR</Btn>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {group.emojis?.length > 0 && <span className="text-2xl leading-none">{group.emojis.join(' ')}</span>}
                <div className="font-condensed font-bold text-[28px] text-white tracking-wide">{group.name}</div>
              </div>
              {group.description && (
                <div className="font-condensed text-[14px] text-gray-500 tracking-wide mt-0.5 wrap-break-word whitespace-normal">{group.description}</div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted">TORNEOS</div>
          {isOwner && (
            <Btn
              variant="primary"
              size="sm"
              icon={Plus}
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
            >
              NUEVO TORNEO
            </Btn>
          )}
        </div>
        {(!group.tournaments || group.tournaments.length === 0) && !isOwner && (
          <div className="text-center text-dim py-10 px-5 font-sans leading-loose">No hay torneos todavía.<br/>¡Creá el primero!</div>
        )}
        <div className="flex flex-col gap-2.5">
          {group.tournaments?.slice(0, visibleCount).map((t, i) => {
            const isAmericano = t.format === 'americano';
            const fmtColor = isAmericano ? '#e8f04a' : '#63b3ed';
            const fmtBg    = isAmericano ? 'rgba(232,240,74,0.07)' : 'rgba(99,179,237,0.07)';
            const fmtBorder = isAmericano ? 'rgba(232,240,74,0.18)' : 'rgba(99,179,237,0.18)';
            const count = isAmericano ? t.pair_count : t.player_count;
            const CountIcon = isAmericano ? Users : User;
            const statusMeta = TOURNAMENT_STATUS_META[tournamentDisplayStatus({
              status: t.status, event_date: t.event_date, hasPlayed: (t.match_count ?? 0) > 0,
            })];
            return (
            <FadeInCard key={t.id} delay={Math.min(i, 5) * 60}
              className="border border-border-mid rounded-lg cursor-pointer overflow-hidden card-link"
              style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #1c1c1c 100%)' }}
              onClick={() => { navigate(`/cat/${groupId}/torneo/${t.id}`); }}>
              {t.status === 'active' && (
                <div className="h-px bg-gradient-to-r from-green/50 via-green/20 to-transparent" />
              )}
              <div className="flex min-w-0">
                <div
                  className="flex items-center justify-center shrink-0 w-7"
                  style={{ background: fmtBg, borderRight: `1px solid ${fmtBorder}` }}
                >
                  <span
                    className="font-mono font-bold tracking-widest select-none"
                    style={{ fontSize: 8, color: fmtColor, writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.2em' }}
                  >
                    {isAmericano ? 'AMERICANO' : 'LIGA'}
                  </span>
                </div>
                <div className="px-4 py-3.5 flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="font-condensed font-bold text-lg text-content leading-tight">{t.name}</div>
                    <Badge variant="status" color={statusMeta.color}>
                      {statusMeta.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {count > 0 && (
                      <span className="flex items-center gap-1 font-mono text-sm text-dim">
                        <CountIcon size={11} />{count}
                      </span>
                    )}
                    {t.match_count > 0 && (
                      <span className="flex items-center gap-1 font-mono text-sm text-dim">
                        <Flame size={11} />{t.match_count}
                      </span>
                    )}
                    {!isAmericano && t.mode && (
                      <span className="font-mono text-sm text-dim">
                        {t.mode === 'pairs' ? '(en parejas)' : '(equipos libres)'}
                      </span>
                    )}
                    <span className="font-mono text-sm text-dim ml-auto">{fmt(t.event_date ?? t.created_at)}</span>
                  </div>
                  {t.club_name && (
                    <div className="flex items-center gap-1.5 text-sm text-secondary font-mono mt-2">
                      <Building2 size={11} className="shrink-0" />
                      <span className="truncate">{t.club_name}</span>
                    </div>
                  )}
                  {t.status === 'finished' && t.winner_label && (
                    <div className="flex items-center gap-1.5 text-sm text-brand font-mono mt-2">
                      <Trophy size={11} /> {t.winner_label}
                    </div>
                  )}
                </div>
              </div>
            </FadeInCard>
            );
          })}
        </div>
        {group.tournaments && visibleCount < group.tournaments.length && (
          <div className="flex justify-center mt-4">
            <Btn size="sm" onClick={() => setVisibleCount(c => c + 10)}>
              CARGAR MÁS ({group.tournaments.length - visibleCount} restantes)
            </Btn>
          </div>
        )}
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted my-5 py-4 border-t border-border mt-10">ESTADÍSTICAS HISTÓRICAS</div>
        <HistoricalStats tournaments={allTournaments} showTorneos={false} ownerIsPremium={group.owner_is_premium ?? false} />
      </div>

      {/* Modal emojis */}
      {showEmojiModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEmojiModal(false); }}>
          <div className="bg-surface border border-border-mid rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-sm text-[#555] tracking-widest">ÍCONOS · máx. 2</div>
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
            <Btn variant="primary" full size="md" onClick={() => setShowEmojiModal(false)}>CONFIRMAR</Btn>
          </div>
        </div>
      )}

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}

      {deleteModal && (
        <Modal
          title={`¿Eliminar "${group.name}"?`}
          confirmText="Eliminar para siempre"
          confirmDanger
          confirmDisabled={deleteInput !== group.name}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteModal(false); setDeleteInput(''); }}
        >
          <p className="text-secondary text-sm leading-relaxed mb-4">
            Se eliminará la categoría y <strong className="text-white">todos sus torneos</strong>. Los jugadores quedan en la base de datos para estadísticas históricas. <strong className="text-white">Esta acción no se puede deshacer.</strong>
          </p>
          <label className="block text-[11px] font-mono tracking-widest text-muted mb-2">
            ESCRIBÍ <span className="text-danger font-bold">{group.name}</span> PARA CONFIRMAR
          </label>
          <input
            className="w-full bg-base border border-border-strong text-white px-3 py-2 rounded text-sm font-sans outline-none focus:border-danger/60 transition-colors"
            placeholder={group.name}
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            autoFocus
          />
        </Modal>
      )}
    </div>
  );
}
