import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../../utils/api'
import { useToast } from '../../context/useToast'
import { clubToForm, formToClub } from './clubForm'
import ClubFormFields from './ClubFormFields'
import Btn from '../shared/Btn'

// Modal para que un usuario solicite el alta de un club al admin.
export default function ClubRequestModal({ initialName = '', onClose, onSubmitted }) {
  const { showToast } = useToast()
  const [form, setForm]       = useState(() => ({ ...clubToForm(), name: initialName }))
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)

  const patch = (p) => setForm((f) => ({ ...f, ...p }))

  async function handleSubmit() {
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('El nombre del club debe tener más de 2 caracteres')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await api.clubs.requests.create(formToClub(form))
      showToast('Solicitud enviada. El equipo la revisará pronto.')
      onSubmitted?.()
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
          <span className="font-mono text-[11px] text-[#555] tracking-widest">SOLICITAR CLUB</span>
          <button onClick={onClose} className="bg-transparent border-none text-[#555] hover:text-white cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-muted text-xs font-sans mb-4 leading-relaxed">
            Completá los datos del club que no encontrás. Un administrador lo revisará y lo agregará.
          </p>
          <ClubFormFields form={form} patch={patch} />
          {error && <p className="text-danger text-xs font-mono mt-3">{error}</p>}
          <div className="flex gap-2 mt-5">
            <Btn variant="primary" full size="md" onClick={handleSubmit} loading={saving}>ENVIAR SOLICITUD</Btn>
            <Btn size="md" onClick={onClose}>CANCELAR</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
