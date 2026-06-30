import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Plus, Pencil, Trash2, Building2, X, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { api } from '../../utils/api'
import { useToast } from '../../context/useToast'
import { clubToForm, formToClub } from '../Club/clubForm'
import ClubFormFields from '../Club/ClubFormFields'
import Loader from '../Loader/Loader'
import Modal from '../shared/Modal'
import Btn from '../shared/Btn'

function ClubEditModal({ club, onClose, onSaved }) {
  const { showToast } = useToast()
  const isNew = !club?.id
  const [form, setForm]     = useState(() => clubToForm(club ?? {}))
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(club?.photo_url ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const patch = (p) => setForm((f) => ({ ...f, ...p }))

  function onPickPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('El nombre del club debe tener más de 2 caracteres')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const body = formToClub(form)
      const saved = isNew ? await api.clubs.create(body) : await api.clubs.update(club.id, body)
      if (photoFile) await api.clubs.uploadPhoto(saved.id, photoFile)
      showToast(isNew ? 'Club creado' : 'Club actualizado')
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-1000 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-surface border border-border-mid rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-mid sticky top-0 bg-surface z-10">
          <span className="font-mono text-[11px] text-[#555] tracking-widest">{isNew ? 'NUEVO CLUB' : 'EDITAR CLUB'}</span>
          <button onClick={onClose} className="bg-transparent border-none text-[#555] hover:text-white cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          {/* Foto */}
          <div className="mb-4">
            <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">FOTO</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-base border border-border-mid flex items-center justify-center shrink-0">
                {photoPreview
                  ? <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  : <ImageIcon size={22} className="text-border-strong" />}
              </div>
              <label className="text-xs font-mono text-brand cursor-pointer hover:underline">
                {photoPreview ? 'Cambiar foto' : 'Subir foto'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickPhoto} />
              </label>
            </div>
          </div>

          <ClubFormFields form={form} patch={patch} />
          {error && <p className="text-danger text-xs font-mono mt-3">{error}</p>}
          <div className="flex gap-2 mt-5">
            <Btn variant="primary" full size="md" onClick={handleSave} loading={saving}>
              {isNew ? 'CREAR CLUB' : 'GUARDAR'}
            </Btn>
            <Btn size="md" onClick={onClose}>CANCELAR</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminClubs() {
  const { showToast } = useToast()
  const [clubs, setClubs]   = useState([])
  const [q, setQ]           = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [editing, setEditing] = useState(null)   // club | {} (nuevo) | null
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy]     = useState(false)

  const fetchClubs = useCallback(async (query = '') => {
    setLoading(true)
    try {
      setClubs(await api.clubs.list(query))
      setError(null)
    } catch (e) { setError(e.message) }
    finally     { setLoading(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchClubs(q), q ? 300 : 0)
    return () => clearTimeout(t)
  }, [q, fetchClubs])

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await api.clubs.delete(deleting.id)
      showToast('Club eliminado', 'error')
      setDeleting(null)
      await fetchClubs(q)
    } catch (e) { setError(e.message) }
    finally     { setBusy(false) }
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <Link to="/admin" className="inline-flex items-center gap-1 text-muted hover:text-white text-xs font-mono mb-3 transition-colors">
        <ArrowLeft size={12} /> Dashboard
      </Link>

      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="font-condensed font-black text-2xl tracking-widest text-white">
          CLUBES <span className="text-brand">/ ADMIN</span>
        </h1>
        <Btn variant="primary" size="sm" icon={Plus} onClick={() => setEditing({})}>NUEVO</Btn>
      </div>
      <p className="text-muted text-xs font-mono mb-6">{clubs.length} {clubs.length === 1 ? 'club' : 'clubes'}</p>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar club"
          className="w-full bg-surface border border-border focus:border-brand outline-none text-white text-sm font-mono pl-9 pr-3 py-2 rounded transition-colors" />
      </div>

      {error && <p className="text-danger text-xs font-mono mb-3">{error}</p>}

      {loading ? <Loader /> : (
        <div className="flex flex-col gap-2">
          {clubs.length === 0 && <p className="text-muted text-xs font-mono py-6 text-center">Sin clubes.</p>}
          {clubs.map((c) => (
            <div key={c.id} className="flex items-center gap-3 bg-surface border border-border rounded-lg p-3">
              <div className="w-12 h-12 rounded-md overflow-hidden bg-base border border-border-mid flex items-center justify-center shrink-0">
                {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover" /> : <Building2 size={18} className="text-border-strong" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white font-semibold truncate">{c.name}</div>
                {c.location_name && <div className="text-muted text-[11px] font-mono truncate">{c.location_name}</div>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link to={`/club/${c.id}`} className="p-2 text-muted hover:text-white transition-colors" title="Ver perfil"><ExternalLink size={15} /></Link>
                <button onClick={() => setEditing(c)} className="p-2 text-muted hover:text-brand transition-colors cursor-pointer" title="Editar"><Pencil size={15} /></button>
                <button onClick={() => setDeleting(c)} className="p-2 text-muted hover:text-danger transition-colors cursor-pointer" title="Eliminar"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ClubEditModal
          club={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => fetchClubs(q)}
        />
      )}

      {deleting && (
        <Modal
          title={`¿Eliminar "${deleting.name}"?`}
          confirmText={busy ? 'Eliminando...' : 'Eliminar'}
          confirmDanger
          confirmDisabled={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        >
          <p className="text-secondary text-sm leading-relaxed">
            Se eliminará el club. Los torneos asociados quedan, pero pierden el vínculo con el club.
          </p>
        </Modal>
      )}
    </div>
  )
}
