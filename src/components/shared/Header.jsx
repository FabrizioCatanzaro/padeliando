import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { User, CircleHelp } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
//import { useTheme } from '../../context/ThemeContext'
import { api } from '../../utils/api'
import logoUrl from '../../assets/padeleando.ico'
import logoTxtUrl from '../../assets/padeleando-txt.png'
import PlayerAvatar from './PlayerAvatar'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [invCount, setInvCount] = useState(0)
  const { user, isLoggedIn, logout } = useAuth()
  //const { theme, toggle } = useTheme()
  const displayCount = isLoggedIn ? invCount : 0
  const navigate = useNavigate()
  const location = useLocation()
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Consultar invitaciones pendientes cuando el usuario está logueado
  useEffect(() => {
    if (!isLoggedIn) return;
    api.invitations.count()
      .then(d => setInvCount(d.count ?? 0))
      .catch(() => {})
  }, [isLoggedIn, location.pathname])

  function go(path) {
    setOpen(false)
    navigate(path)
  }

  return (
    <div className="px-6 py-4 flex justify-between items-center border-b border-border bg-base">
      <div
        className="flex flex-row gap-2 items-center font-condensed font-black text-xl tracking-widest text-white cursor-pointer"
        onClick={() => location.pathname === '/' ? navigate(0) : navigate('/')}
      >
        <img className='max-w-8 hidden md:block' src={logoUrl}/>
        <img className='max-h-10' src={logoTxtUrl}/>
      </div>

      <div className="flex items-center gap-2">
        {/* <button
          onClick={toggle}
          className="bg-transparent border border-border-strong p-2 rounded cursor-pointer text-[#555] hover:text-white hover:border-[#555] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button> */}

        <Link
          to="/tutorial"
          className="bg-transparent border border-border-strong p-2 rounded text-[#555] hover:text-white hover:border-[#555] transition-colors"
          aria-label="Ayuda"
          title="Ayuda"
        >
          <CircleHelp size={18} />
        </Link>

        <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className={`relative bg-transparent rounded cursor-pointer text-[#555] hover:text-white hover:border-[#555] transition-colors ${isLoggedIn ? 'p-0 border-0' : 'p-2 border border-border-strong'}`}
        >
          {isLoggedIn
            ? <PlayerAvatar name={user?.name} src={user?.avatar_url ?? null} size={30} />
            : <User className='text-gray-200' size={18} />}
          {displayCount > 0 && (
            <span className="absolute -top-1 animate-pulse -right-1 bg-brand text-base text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
              {displayCount > 9 ? '9+' : displayCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 bg-surface-alt border border-border-strong rounded min-w-40 z-50 overflow-hidden">
            {isLoggedIn ? (
              <>
                <div className="px-4 py-2.5 text-[11px] text-gray-500 font-mono border-b border-border-mid">
                  @{user?.username}
                </div>
                <button
                  onClick={() => go(`/u/${user?.username}`)}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#ccc] hover:bg-border-mid hover:text-white transition-colors cursor-pointer bg-transparent border-0 font-sans"
                >
                  Mi perfil
                </button>
                <button
                  onClick={() => go('/')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#ccc] hover:bg-border-mid hover:text-white transition-colors cursor-pointer bg-transparent border-0 font-sans"
                >
                  Mis torneos
                </button>
                <button
                  onClick={() => go('/invitations')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#ccc] hover:bg-border-mid hover:text-white transition-colors cursor-pointer bg-transparent border-0 flex items-center justify-between font-sans"
                >
                  <span>Invitaciones</span>
                  {displayCount > 0 && (
                    <span className="bg-brand text-base text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {displayCount}
                    </span>
                  )}
                </button>
                {/* <button
                  onClick={() => go('/subscription')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#ccc] hover:bg-border-mid hover:text-white transition-colors cursor-pointer bg-transparent border-0 font-sans"
                >
                  Suscripción (test)
                </button> */}
                <div className="border-t border-border-mid" />
                <button
                  onClick={() => { setOpen(false); logout(); navigate('/') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-border-mid hover:text-red-500 transition-colors cursor-pointer bg-transparent border-0"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
                <button
                  onClick={() => go('/login')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#ccc] hover:bg-border-mid hover:text-white transition-colors cursor-pointer bg-transparent border-0"
                >
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
