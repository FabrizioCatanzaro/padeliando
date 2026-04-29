import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { User, CircleHelp, Bell } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { api } from '../../utils/api'
import logoUrl from '../../assets/padeleando.ico'
import logoTxtUrl from '../../assets/padeleando-txt.png'
import PlayerAvatar from './PlayerAvatar'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function NotifItemText({ n }) {
  const actor = <span className="font-semibold text-white">@{n.actor_username ?? n.actor_name}</span>;
  if (n.type === 'follow') return <>{actor} te empezó a seguir</>;
  if (n.type === 'invitation') return (
    <>{actor} te invitó a <span className="text-white font-semibold">{n.group_name ?? 'un grupo'}</span>
      {n.player_name ? <> como <span className="text-brand">{n.player_name}</span></> : null}</>
  );
  return null;
}

export default function Header() {
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [notifOpen,     setNotifOpen]     = useState(false)
  const [notifCount,    setNotifCount]    = useState(0)
  const [notifs,        setNotifs]        = useState([])
  const [notifLoading,  setNotifLoading]  = useState(false)

  const { user, isLoggedIn, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const menuRef   = useRef(null)
  const notifRef  = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current  && !menuRef.current.contains(e.target))  setMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return;
    api.notifications.count()
      .then(d => setNotifCount(d.count ?? 0))
      .catch(() => {})
  }, [isLoggedIn, location.pathname])

  const openNotifications = useCallback(async () => {
    if (notifOpen) { setNotifOpen(false); return; }
    setMenuOpen(false);
    setNotifOpen(true);
    setNotifLoading(true);
    try {
      const data = await api.notifications.list(8);
      setNotifs(data);
      if (notifCount > 0) {
        api.notifications.markAllRead().catch(() => {});
        setNotifCount(0);
      }
    } catch { /* ignore */ }
    finally { setNotifLoading(false); }
  }, [notifOpen, notifCount])

  function updateNotif(id, patch) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));
  }

  async function handleFollow(n) {
    try {
      if (n.is_following_back) {
        await api.follows.unfollow(n.actor_username);
        updateNotif(n.id, { is_following_back: false });
      } else {
        await api.follows.follow(n.actor_username);
        updateNotif(n.id, { is_following_back: true });
      }
    } catch { /* ignore */ }
  }

  async function handleInvitation(n, action) {
    try {
      await api.invitations.respond(n.entity_id, action);
      updateNotif(n.id, { invitation_status: action === 'accept' ? 'accepted' : 'rejected' });
    } catch { /* ignore */ }
  }

  function go(path) {
    setMenuOpen(false);
    navigate(path);
  }

  return (
    <div className="px-6 py-4 flex justify-between items-center border-b border-border bg-base">
      <div
        className="flex flex-row gap-2 items-center font-condensed font-black text-xl tracking-widest text-white cursor-pointer"
        onClick={() => location.pathname === '/' ? navigate(0) : navigate('/')}
      >
        <img className='max-w-8 hidden md:block' src={logoUrl} />
        <img className='max-h-10' src={logoTxtUrl} />
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/tutorial"
          className="bg-transparent border border-border-strong p-2 rounded text-[#555] hover:text-white hover:border-[#555] transition-colors"
          aria-label="Ayuda"
          title="Ayuda"
        >
          <CircleHelp size={18} />
        </Link>

        {/* Bell — notificaciones */}
        {isLoggedIn && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={openNotifications}
              className="relative bg-transparent border border-border-strong p-2 rounded cursor-pointer text-[#555] hover:text-white hover:border-[#555] transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand text-base text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none animate-pulse">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[#111] border border-border-strong rounded z-50 overflow-hidden shadow-xl" style={{ width: 320 }}>
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-border-mid">
                  <span className="text-[10px] font-mono tracking-[3px] text-muted">NOTIFICACIONES</span>
                  <Link
                    to="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-[10px] font-mono text-dim hover:text-white transition-colors"
                  >
                    Ver todas
                  </Link>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="px-4 py-6 text-center text-dim text-xs font-mono">Cargando...</div>
                  ) : notifs.length === 0 ? (
                    <div className="px-4 py-8 text-center text-dim text-xs font-mono">Sin notificaciones</div>
                  ) : (
                    notifs.map(n => (
                      <DropdownNotifItem
                        key={n.id}
                        n={n}
                        onNavigate={(path) => { setNotifOpen(false); navigate(path); }}
                        onFollow={() => handleFollow(n)}
                        onInvitation={(action) => handleInvitation(n, action)}
                      />
                    ))
                  )}
                </div>

                <div className="border-t border-border-mid px-4 py-2.5">
                  <Link
                    to="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-[11px] font-mono text-brand hover:brightness-110 transition-colors"
                  >
                    Ver historial completo →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setNotifOpen(false); setMenuOpen(o => !o); }}
            className={`relative bg-transparent rounded cursor-pointer text-[#555] hover:text-white hover:border-[#555] transition-colors ${isLoggedIn ? 'p-0 border-0' : 'p-2 border border-border-strong'}`}
          >
            {isLoggedIn
              ? <PlayerAvatar name={user?.name} src={user?.avatar_url ?? null} size={30} premium={user?.subscription?.plan === 'premium'} />
              : <User className='text-gray-200' size={18} />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-surface-alt border border-border-strong rounded min-w-40 z-50 overflow-hidden">
              {isLoggedIn ? (
                <>
                  <div className="px-4 py-2.5 text-[11px] text-gray-500 font-mono border-b border-border-mid">
                    @{user?.username}
                  </div>
                  <button onClick={() => go(`/u/${user?.username}`)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#ccc] hover:bg-border-mid hover:text-white transition-colors cursor-pointer bg-transparent border-0 font-sans">
                    Mi perfil
                  </button>
                  <button onClick={() => go('/')}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#ccc] hover:bg-border-mid hover:text-white transition-colors cursor-pointer bg-transparent border-0 font-sans">
                    Mis categorías
                  </button>
                  <div className="border-t border-border-mid" />
                  <button
                    onClick={() => { setMenuOpen(false); logout(); navigate('/'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-border-mid hover:text-red-500 transition-colors cursor-pointer bg-transparent border-0"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <button onClick={() => go('/login')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#ccc] hover:bg-border-mid hover:text-white transition-colors cursor-pointer bg-transparent border-0">
                  Iniciar sesión
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DropdownNotifItem({ n, onNavigate, onFollow, onInvitation }) {
  const [busy, setBusy] = useState(false);
  const unread = !n.read;

  async function wrap(fn) {
    if (busy) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b border-border-mid last:border-b-0 transition-colors ${unread ? 'bg-brand/5' : ''}`}>
      {unread && <div className="shrink-0 mt-2.5 w-1.5 h-1.5 rounded-full bg-brand flex-none" />}
      <div
        className={`shrink-0 cursor-pointer ${unread ? '' : 'ml-[18px]'}`}
        onClick={() => n.actor_username && onNavigate(`/u/${n.actor_username}`)}
      >
        <PlayerAvatar name={n.actor_name} src={n.actor_avatar_url} size={32} premium={n.actor_is_premium} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-secondary leading-snug">
          <NotifItemText n={n} />
        </div>
        <div className="text-[10px] font-mono text-dim mt-0.5">{timeAgo(n.created_at)}</div>

        {/* Actions */}
        {n.type === 'follow' && n.actor_username && (
          <button
            onClick={() => wrap(onFollow)}
            disabled={busy}
            className={`mt-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded border cursor-pointer transition-colors disabled:opacity-40 ${
              n.is_following_back
                ? 'border-border-strong text-dim hover:border-danger hover:text-danger'
                : 'border-brand/60 text-brand hover:bg-brand hover:text-base'
            }`}
          >
            {n.is_following_back ? 'Siguiendo' : 'Seguir'}
          </button>
        )}

        {n.type === 'invitation' && (
          n.invitation_status === 'accepted' ? (
            <div className="mt-1.5 text-[10px] font-mono text-green">✓ Aceptada</div>
          ) : n.invitation_status === 'rejected' ? (
            <div className="mt-1.5 text-[10px] font-mono text-dim">Rechazada</div>
          ) : n.invitation_status === 'pending' ? (
            <div className="mt-1.5 flex gap-1.5">
              <button onClick={() => wrap(() => onInvitation('accept'))} disabled={busy}
                className="text-[10px] font-mono px-2.5 py-0.5 rounded border border-brand/60 text-brand hover:bg-brand hover:text-base cursor-pointer transition-colors disabled:opacity-40">
                Aceptar
              </button>
              <button onClick={() => wrap(() => onInvitation('reject'))} disabled={busy}
                className="text-[10px] font-mono px-2.5 py-0.5 rounded border border-border-strong text-dim hover:border-danger hover:text-danger cursor-pointer transition-colors disabled:opacity-40">
                Rechazar
              </button>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
