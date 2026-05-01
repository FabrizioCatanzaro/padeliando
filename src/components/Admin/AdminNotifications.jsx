import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Megaphone } from 'lucide-react'
import { api } from '../../utils/api'
import Loader from '../Loader/Loader'

const TARGET_LABELS = { all: 'Todos los usuarios', free: 'Solo free', premium: 'Solo premium', user: 'Usuario específico' }
const CHANNEL_LABELS = { app: 'Solo en app', app_email: 'App + Email' }

function formatDate(str) {
  return new Date(str).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminNotifications() {
  const [form, setForm]         = useState({ title: '', body: '', target: 'all', target_user_id: '', channel: 'app' })
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [sending, setSending]   = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const [sendError, setSendError]   = useState(null)

  const [history, setHistory]       = useState([])
  const [histTotal, setHistTotal]   = useState(0)
  const [histPage, setHistPage]     = useState(1)
  const [histLoading, setHistLoading] = useState(true)

  const loadHistory = useCallback(async (page = 1) => {
    setHistLoading(true)
    try {
      const data = await api.admin.broadcasts({ page, limit: 20 })
      setHistory(data.broadcasts)
      setHistTotal(data.total)
      setHistPage(page)
    } finally {
      setHistLoading(false)
    }
  }, [])

  useEffect(() => { loadHistory(1) }, [loadHistory])

  // Buscar usuario cuando target === 'user'
  useEffect(() => {
    if (form.target !== 'user' || userSearch.trim().length < 2) {
      setUserResults([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const data = await api.admin.users({ q: userSearch, limit: 10 })
        setUserResults(data.users ?? [])
      } catch { setUserResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [userSearch, form.target])

  function selectUser(u) {
    setSelectedUser(u)
    setForm(f => ({ ...f, target_user_id: u.id }))
    setUserSearch(u.name + (u.username ? ` (@${u.username})` : ''))
    setUserResults([])
  }

  async function handleSend(e) {
    e.preventDefault()
    setSendError(null)
    setSendResult(null)
    if (!form.title.trim() || !form.body.trim()) {
      setSendError('Completá título y cuerpo.')
      return
    }
    if (form.target === 'user' && !form.target_user_id) {
      setSendError('Seleccioná un usuario.')
      return
    }
    setSending(true)
    try {
      const res = await api.admin.broadcast({
        title:          form.title.trim(),
        body:           form.body.trim(),
        target:         form.target,
        target_user_id: form.target === 'user' ? form.target_user_id : undefined,
        channel:        form.channel,
      })
      setSendResult(res.recipients)
      setForm({ title: '', body: '', target: 'all', target_user_id: '', channel: 'app' })
      setUserSearch('')
      setSelectedUser(null)
      loadHistory(1)
    } catch (err) {
      setSendError(err.message ?? 'Error al enviar')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-muted hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-condensed font-black text-2xl tracking-widest text-white">
            <span className="text-brand">NOTIFICACIONES</span> ADMIN
          </h1>
          <p className="text-muted text-xs font-mono">Enviá mensajes a usuarios de la plataforma</p>
        </div>
      </div>

      {/* Formulario de envío */}
      <form onSubmit={handleSend} className="bg-surface border border-border rounded-lg p-5 mb-8 flex flex-col gap-4">
        <div className="font-condensed font-bold text-[12px] tracking-[3px] text-muted flex items-center gap-2">
          <Megaphone size={13} /> NUEVO MENSAJE
        </div>

        {/* Destino */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-muted">Destinatarios</label>
            <select
              value={form.target}
              onChange={e => {
                setForm(f => ({ ...f, target: e.target.value, target_user_id: '' }))
                setSelectedUser(null)
                setUserSearch('')
              }}
              className="bg-base border border-border-strong text-white text-[12px] font-mono rounded px-3 py-2 cursor-pointer"
            >
              {Object.entries(TARGET_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-muted">Canal</label>
            <select
              value={form.channel}
              onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
              className="bg-base border border-border-strong text-white text-[12px] font-mono rounded px-3 py-2 cursor-pointer"
            >
              {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Búsqueda de usuario específico */}
        {form.target === 'user' && (
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[11px] font-mono text-muted">Buscar usuario</label>
            <input
              type="text"
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setSelectedUser(null); setForm(f => ({ ...f, target_user_id: '' })) }}
              placeholder="Nombre, email o username…"
              className="bg-base border border-border-strong text-white text-[13px] font-mono rounded px-3 py-2 placeholder:text-dim outline-none focus:border-brand transition-colors"
            />
            {userResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 bg-surface border border-border-strong rounded-b shadow-lg">
                {userResults.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectUser(u)}
                    className="w-full text-left px-3 py-2 text-[12px] font-mono text-white hover:bg-base transition-colors border-b border-border last:border-0"
                  >
                    {u.name}
                    {u.username && <span className="text-muted ml-1">@{u.username}</span>}
                    <span className="text-dim ml-1">— {u.email}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <div className="text-[11px] font-mono text-brand">
                Seleccionado: {selectedUser.name} ({selectedUser.email})
              </div>
            )}
          </div>
        )}

        {/* Título */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono text-muted">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            maxLength={120}
            placeholder="Asunto del mensaje…"
            className="bg-base border border-border-strong text-white text-[13px] font-mono rounded px-3 py-2 placeholder:text-dim outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Cuerpo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono text-muted">Mensaje</label>
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={4}
            placeholder="Contenido del mensaje…"
            className="bg-base border border-border-strong text-white text-[13px] font-mono rounded px-3 py-2 placeholder:text-dim outline-none focus:border-brand transition-colors resize-y"
          />
        </div>

        {sendError && <div className="text-danger text-[12px] font-mono">{sendError}</div>}
        {sendResult !== null && (
          <div className="text-brand text-[12px] font-mono">
            Enviado correctamente a {sendResult} usuario{sendResult !== 1 ? 's' : ''}.
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="self-start inline-flex items-center gap-2 bg-brand text-base font-condensed font-bold tracking-widest text-sm px-5 py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          <Send size={13} />
          {sending ? 'Enviando…' : 'ENVIAR'}
        </button>
      </form>

      {/* Historial */}
      <div>
        <div className="font-condensed font-bold text-[12px] tracking-[3px] text-muted mb-3">
          HISTORIAL DE ENVÍOS
          {histTotal > 0 && <span className="text-dim ml-2 font-mono normal-case tracking-normal">({histTotal})</span>}
        </div>

        {histLoading ? (
          <Loader />
        ) : history.length === 0 ? (
          <div className="text-dim text-sm font-mono text-center py-10">Todavía no se enviaron mensajes.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map(b => (
              <BroadcastRow key={b.id} b={b} />
            ))}
          </div>
        )}

        {histTotal > histPage * 20 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => loadHistory(histPage + 1)}
              className="text-[12px] font-mono text-muted hover:text-white transition-colors bg-transparent border border-border-strong px-4 py-2 rounded cursor-pointer"
            >
              Cargar más
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function BroadcastRow({ b }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-[13px] truncate">{b.title}</div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            <span className="text-[11px] font-mono text-muted">{formatDate(b.created_at)}</span>
            <span className="text-[11px] font-mono text-brand">{TARGET_LABELS[b.target] ?? b.target}
              {b.target === 'user' && b.target_user_name && ` — ${b.target_user_name}`}
            </span>
            <span className="text-[11px] font-mono text-muted">{CHANNEL_LABELS[b.channel] ?? b.channel}</span>
            <span className="text-[11px] font-mono text-dim">{b.recipients} destinatario{b.recipients !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(x => !x)}
          className="text-[11px] font-mono text-muted hover:text-white transition-colors cursor-pointer shrink-0 bg-transparent border-none"
        >
          {expanded ? 'Ocultar' : 'Ver'}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border text-[12px] font-mono text-secondary whitespace-pre-wrap">
          {b.body}
        </div>
      )}
    </div>
  )
}
