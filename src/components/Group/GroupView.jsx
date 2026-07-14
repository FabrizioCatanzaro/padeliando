/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { api } from '../../utils/api';
import { adaptTournament, fmt, tournamentDisplayStatus, TOURNAMENT_STATUS_META } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/useToast';
import { useParams } from 'react-router-dom';
import { Trash2, Pencil, Globe, Lock, ChevronLeft, Plus, Trophy, Smile, Check, X, Users, User, Flame, User2, Building2, Share2, UserPlus, ArrowLeftRight, Link2, LogOut, Copy } from 'lucide-react';
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

  // co-organizadores + transferencia
  const [showCollabModal,   setShowCollabModal]   = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [collabIdentifier,  setCollabIdentifier]  = useState('');
  const [transferIdentifier, setTransferIdentifier] = useState('');
  const [collabLink,        setCollabLink]        = useState('');
  const [transferLink,      setTransferLink]      = useState('');
  const [transferConfirm,   setTransferConfirm]   = useState(false);
  const [collabBusy,        setCollabBusy]        = useState(false);
  const [transferBusy,      setTransferBusy]      = useState(false);
  const [removeCollabTarget, setRemoveCollabTarget] = useState(null); // { user_id, name, username } | null
  const [leaveConfirm,      setLeaveConfirm]      = useState(false);

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

  function refreshGroup() {
    return api.groups.get(groupId).then(setGroup);
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

  // ── Co-organizadores ──────────────────────────────────────────────────
  async function handleInviteCollab() {
    if (!collabIdentifier.trim()) return;
    setCollabBusy(true);
    try {
      const res = await api.collaborators.invite(groupId, { identifier: collabIdentifier.trim() });
      setCollabIdentifier('');
      showToast(`Invitación enviada a @${res.invited?.username ?? ''}`);
      await refreshGroup();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setCollabBusy(false);
    }
  }

  async function handleCollabLink() {
    setCollabBusy(true);
    try {
      const res = await api.collaborators.invite(groupId, { link: true });
      setCollabLink(res.url);
      await navigator.clipboard.writeText(res.url).catch(() => {});
      showToast('Link de invitación copiado');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setCollabBusy(false);
    }
  }

  async function handleRemoveCollab(userId) {
    try {
      await api.collaborators.remove(groupId, userId);
      showToast('Co-organizador eliminado', 'error');
      await refreshGroup();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setRemoveCollabTarget(null);
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Link copiado');
    } catch {
      showToast('No se pudo copiar', 'error');
    }
  }

  async function handleLeaveCollab() {
    try {
      await api.collaborators.leave(groupId);
      showToast('Saliste como co-organizador', 'info');
      navigate('/');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  // ── Transferencia de propiedad ────────────────────────────────────────
  async function handleTransfer() {
    if (!transferIdentifier.trim() || !transferConfirm) return;
    setTransferBusy(true);
    try {
      const res = await api.transfers.start(groupId, { identifier: transferIdentifier.trim() });
      setTransferIdentifier('');
      setTransferConfirm(false);
      showToast(`Transferencia enviada a @${res.target?.username ?? ''}`);
      await refreshGroup();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setTransferBusy(false);
    }
  }

  async function handleTransferLink() {
    if (!transferConfirm) return;
    setTransferBusy(true);
    try {
      const res = await api.transfers.start(groupId, { link: true });
      setTransferLink(res.url);
      await navigator.clipboard.writeText(res.url).catch(() => {});
      showToast('Link de transferencia copiado');
      await refreshGroup();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setTransferBusy(false);
    }
  }

  async function handleCancelTransfer() {
    try {
      await api.transfers.cancel(groupId);
      setTransferLink('');
      showToast('Transferencia cancelada', 'info');
      await refreshGroup();
    } catch (e) {
      showToast(e.message, 'error');
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

  // is_owner: exclusivo del dueño (editar/borrar categoría, transferir, gestionar co-orgs).
  // can_manage: dueño O co-organizador (crear/gestionar jornadas).
  const isOwner   = group.is_owner ?? (!!user && String(group.user_id) === String(user.id));
  const canManage = group.can_manage ?? isOwner;
  const isCollaborator = canManage && !isOwner;

  if (!group.is_public && !canManage) {
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
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {group.is_public && (
                <Btn size="sm" icon={copied ? Check : Share2} onClick={copyLink} title="Compartir" />
              )}
              <Btn size="sm" icon={Users} onClick={() => setShowCollabModal(true)} title="Co-organizadores">
                {group.collaborators?.length ? String(group.collaborators.length) : ''}
              </Btn>
              <Btn size="sm" icon={ArrowLeftRight} onClick={() => setShowTransferModal(true)} title="Transferir propiedad" />
              <Btn size="sm" icon={Pencil} onClick={startEdit} title="Editar categoría" />
              <Btn variant="danger" size="sm" icon={Trash2} onClick={() => { setDeleteModal(true); setDeleteInput(''); }} title="Eliminar categoría" />
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
              <div className="flex items-start gap-3">
                {group.emojis?.length > 0 && (
                  <div className="flex flex-col items-center justify-center gap-1 shrink-0 bg-surface border border-border-mid rounded-lg px-3 py-2 self-stretch">
                    {group.emojis.map((e) => <span key={e} className="text-2xl leading-none">{e}</span>)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-condensed font-bold text-[28px] text-white tracking-wide">{group.name}</div>
                  {group.description && (
                    <div className="font-condensed text-[14px] text-gray-500 tracking-wide mt-0.5 wrap-break-word whitespace-normal">{group.description}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Privacidad (solo dueño) — justo encima de la línea divisoria */}
        {isOwner && !editingGroup && (
          <div>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border ${group.is_public ? 'text-cyan border-cyan/40' : 'text-yellow-400 border-yellow-400/40'}`}>
              {group.is_public ? <Globe size={12}/> : <Lock size={12}/>}
              {group.is_public ? 'Categoría pública' : 'Categoría privada'}
            </span>
          </div>
        )}

        {/* Cartel de co-organizador */}
        {isCollaborator && (
          <div className="flex items-center justify-between gap-2 bg-brand/5 border border-brand/25 rounded-md px-3 py-2">
            <span className="flex items-center gap-2 text-brand text-[12px] font-mono tracking-wide">
              <Users size={14} className="shrink-0" /> Sos co-organizador de esta categoría
            </span>
            <Btn variant="danger" size="sm" icon={LogOut} onClick={() => setLeaveConfirm(true)}>SALIR</Btn>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted">TORNEOS</div>
          {canManage && (
            <Btn
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                // El cupo mensual del plan free se evalúa contra el DUEÑO de la categoría,
                // no contra quien crea (un co-organizador premium no evade el límite del dueño).
                if (!group.owner_is_premium) {
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
        {(!group.tournaments || group.tournaments.length === 0) && !canManage && (
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
            const displayStatus = tournamentDisplayStatus({
              status: t.status, hasLiveMatch: !!t.live_match, hasPlayed: (t.match_count ?? 0) > 0,
            });
            const statusMeta = TOURNAMENT_STATUS_META[displayStatus];
            // Línea superior: cyan si es próximo, verde si está en curso/en vivo, nada si finalizó.
            const topLineClass = displayStatus === 'upcoming'
              ? 'from-cyan/50 via-cyan/20 to-transparent'
              : 'from-green/50 via-green/20 to-transparent';
            return (
            <FadeInCard key={t.id} delay={Math.min(i, 5) * 60}
              className="border border-border-mid rounded-lg cursor-pointer overflow-hidden card-link"
              style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #1c1c1c 100%)' }}
              onClick={() => { navigate(`/cat/${groupId}/torneo/${t.id}`); }}>
              {displayStatus !== 'finished' && (
                <div className={`h-px ml-7 bg-gradient-to-r ${topLineClass}`} />
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
        <HistoricalStats tournaments={allTournaments} showTorneos={false} ownerIsPremium={group.owner_is_premium ?? false} groupName={group.name} />
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

      {/* Modal co-organizadores (solo dueño) */}
      {showCollabModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCollabModal(false); }}>
          <div className="bg-surface border border-border-mid rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="font-condensed font-bold text-lg text-white tracking-wide">Co-organizadores</div>
              <button type="button" onClick={() => setShowCollabModal(false)}
                className="bg-transparent border-none text-[#555] hover:text-white cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-secondary text-[13px] leading-relaxed mb-4">
              Pueden gestionar las jornadas de esta categoría igual que vos, pero <strong className="text-white">no</strong> editar/borrar la categoría ni transferirla.
            </p>

            <div className="flex flex-col gap-2 mb-4">
              {group.collaborators?.length ? group.collaborators.map(c => (
                <div key={c.user_id} className="flex items-center justify-between gap-2 bg-base border border-border-mid rounded px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User2 size={14} className="text-brand shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{c.name}</div>
                      {c.username && <div className="text-[11px] font-mono text-dim truncate">@{c.username}</div>}
                    </div>
                  </div>
                  <Btn variant="danger" size="sm" icon={X} onClick={() => setRemoveCollabTarget(c)} title="Quitar co-organizador" />
                </div>
              )) : (
                <div className="text-dim text-sm text-center py-2">Todavía no hay co-organizadores.</div>
              )}
            </div>

            <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">INVITAR POR @USUARIO O EMAIL</label>
            <div className="flex gap-2 mb-3">
              <input
                value={collabIdentifier}
                onChange={(e) => setCollabIdentifier(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleInviteCollab(); }}
                placeholder="@usuario o email"
                className="flex-1 bg-base border border-border-strong text-white px-3 py-2 rounded text-sm font-sans outline-none focus:border-brand/60 transition-colors"
              />
              <Btn variant="primary" size="sm" icon={UserPlus} loading={collabBusy} onClick={handleInviteCollab}>INVITAR</Btn>
            </div>

            {collabLink ? (
              <div className="flex items-center gap-2 bg-base border border-border-mid rounded px-3 py-2">
                <span className="flex-1 text-[11px] font-mono text-dim break-all">{collabLink}</span>
                <Btn size="sm" icon={Copy} onClick={() => copyText(collabLink)} title="Copiar link">COPIAR</Btn>
              </div>
            ) : (
              <Btn size="sm" icon={Link2} full loading={collabBusy} onClick={handleCollabLink}>CREAR LINK DE INVITACIÓN</Btn>
            )}
          </div>
        </div>
      )}

      {/* Modal transferir propiedad (solo dueño) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowTransferModal(false); }}>
          <div className="bg-surface border border-border-mid rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="font-condensed font-bold text-lg text-white tracking-wide">Transferir propiedad</div>
              <button type="button" onClick={() => setShowTransferModal(false)}
                className="bg-transparent border-none text-[#555] hover:text-white cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="bg-danger/10 border border-danger/40 rounded px-3 py-2.5 mb-4">
              <p className="text-danger text-[13px] leading-relaxed">
                <strong>Esta acción es irreversible.</strong> El nuevo dueño tendrá el control total de la categoría y de todos sus torneos. Vos pasarás a ser co-organizador. La transferencia solo se completa si la otra persona la <strong>acepta</strong>.
              </p>
            </div>

            {group.pending_transfer ? (
              <div className="flex flex-col gap-3">
                <div className="bg-base border border-border-mid rounded px-3 py-2.5 text-sm text-secondary">
                  Transferencia pendiente
                  {group.pending_transfer.to_username
                    ? <> a <span className="text-brand font-mono">@{group.pending_transfer.to_username}</span></>
                    : <> por <span className="text-brand">link</span></>}
                  . Esperando que la acepte.
                </div>
                <Btn variant="danger" size="sm" icon={X} full onClick={handleCancelTransfer}>CANCELAR TRANSFERENCIA</Btn>
              </div>
            ) : (
              <>
                <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">TRANSFERIR A @USUARIO O EMAIL</label>
                <input
                  value={transferIdentifier}
                  onChange={(e) => setTransferIdentifier(e.target.value)}
                  placeholder="@usuario o email"
                  className="w-full bg-base border border-border-strong text-white px-3 py-2 rounded text-sm font-sans outline-none focus:border-brand/60 transition-colors mb-3"
                />
                <label className="flex items-start gap-2 mb-4 cursor-pointer select-none">
                  <input type="checkbox" checked={transferConfirm} onChange={(e) => setTransferConfirm(e.target.checked)} className="mt-0.5" />
                  <span className="text-[12px] text-secondary leading-snug">Entiendo que esta acción es irreversible.</span>
                </label>
                <div className="flex flex-col gap-2">
                  <Btn variant="danger" size="sm" icon={ArrowLeftRight} full loading={transferBusy}
                    disabled={!transferIdentifier.trim() || !transferConfirm}
                    onClick={handleTransfer}>TRANSFERIR</Btn>
                  {transferLink ? (
                    <div className="flex items-center gap-2 bg-base border border-border-mid rounded px-3 py-2">
                      <span className="flex-1 text-[11px] font-mono text-dim break-all">{transferLink}</span>
                      <Btn size="sm" icon={Copy} onClick={() => copyText(transferLink)} title="Copiar link">COPIAR</Btn>
                    </div>
                  ) : (
                    <Btn size="sm" icon={Link2} full loading={transferBusy}
                      disabled={!transferConfirm}
                      onClick={handleTransferLink}>CREAR LINK DE TRANSFERENCIA</Btn>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmar quitar co-organizador */}
      {removeCollabTarget && (
        <Modal
          title="¿Quitar co-organizador?"
          confirmText="Quitar"
          confirmDanger
          onConfirm={() => handleRemoveCollab(removeCollabTarget.user_id)}
          onCancel={() => setRemoveCollabTarget(null)}
        >
          <strong className="text-white">{removeCollabTarget.name}</strong>
          {removeCollabTarget.username ? ` (@${removeCollabTarget.username})` : ''} dejará de poder gestionar las jornadas de esta categoría. Podés volver a invitarlo cuando quieras.
        </Modal>
      )}

      {/* Confirmar salir como co-organizador */}
      {leaveConfirm && (
        <Modal
          title="¿Salir como co-organizador?"
          confirmText="Salir"
          confirmDanger
          onConfirm={handleLeaveCollab}
          onCancel={() => setLeaveConfirm(false)}
        >
          Vas a perder el acceso para gestionar las jornadas de <strong className="text-white">{group.name}</strong>. Solo el dueño podría volver a invitarte.
        </Modal>
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
