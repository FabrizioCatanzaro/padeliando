import { useState } from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import { api } from '../../utils/api'
import { useToast } from '../../context/useToast'
import { clubToForm, formToClub } from './clubForm'
import ClubFormFields from './ClubFormFields'
import Btn from '../shared/Btn'

// Modal de edición/alta directa de un club (uso de admin).
// club = null → alta; club con id → edición. onSaved recibe el club guardado.
export default function ClubEditModal({ club, onClose, onSaved }) {
  const { showToast } = useToast()
  const isNew = !club?.id
  const [form, setForm]     = useState(() => clubToForm(club ?? {}))
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(club?.photo_url ?? null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const patch = (p) => setForm((f) => ({ ...f, ...p }))

  function onPickPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setRemovePhoto(false)
  }

  function handleRemovePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setRemovePhoto(true)
  }

  async function handleSave() {
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('El nombre del club debe tener más de 2 caracteres')
      return
    }
    if (form.lat == null || form.lon == null) {
      setError('Marcá la ubicación del club en el mapa')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const body = formToClub(form)
      const saved = isNew ? await api.clubs.create(body) : await api.clubs.update(club.id, body)
      if (photoFile) await api.clubs.uploadPhoto(saved.id, photoFile)
      else if (removePhoto && club?.photo_url) await api.clubs.deletePhoto(saved.id)
      showToast(isNew ? 'Club creado' : 'Club actualizado')
      onSaved?.(saved)
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
              <div className="flex flex-col items-start gap-1.5">
                <label className="text-xs font-mono text-brand cursor-pointer hover:underline">
                  {photoPreview ? 'Cambiar foto' : 'Subir foto'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickPhoto} />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs font-mono text-danger hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Quitar foto
                  </button>
                )}
              </div>
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
