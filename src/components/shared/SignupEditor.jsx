import { Plus, X } from 'lucide-react';
import { CONTACT_META, CONTACT_TYPES, formatPrice } from '../../utils/signup';

/**
 * Edita el precio y los contactos de inscripción. Se usa igual en la categoría y
 * en la jornada; en la jornada, `inherited` trae lo que hereda de la categoría
 * para poder mostrar qué pasa si se deja un campo vacío.
 *
 * value: { open, price, unit, contacts } — price/unit/contacts en null = heredar.
 */
export default function SignupEditor({ value, onChange, inherited = null }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const contacts = value.contacts ?? [];
  const usedTypes = new Set(contacts.map((c) => c.type));
  const freeType  = CONTACT_TYPES.find((t) => !usedTypes.has(t));

  const setContact = (i, patch) =>
    set({ contacts: contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });

  const inheritedPrice = inherited && inherited.price != null
    ? formatPrice(inherited.price, inherited.unit)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value.open}
          onChange={(e) => set({ open: e.target.checked })}
          className="w-4 h-4 accent-brand cursor-pointer"
        />
        <span className="text-[13px] text-content font-sans">Mostrar precio y contacto para inscribirse</span>
      </label>

      {value.open && (
        <>
          <div className="flex gap-2 items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">PRECIO</label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={value.price ?? ''}
                onChange={(e) => set({ price: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder={inheritedPrice ? `Hereda: ${inheritedPrice}` : 'Sin precio'}
                className="w-full bg-surface border border-border-mid text-white px-2.5 py-1.5 font-sans text-[13px] rounded-sm outline-none"
              />
            </div>
            <div className="shrink-0">
              <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">POR</label>
              <select
                value={value.unit ?? 'player'}
                onChange={(e) => set({ unit: e.target.value })}
                className="bg-surface border border-border-mid text-white px-2.5 py-[7px] font-sans text-[13px] rounded-sm outline-none cursor-pointer"
              >
                <option value="player">Jugador</option>
                <option value="pair">Pareja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-widest text-[#555] mb-1.5">CONTACTO</label>
            <div className="flex flex-col gap-2">
              {contacts.map((c, i) => {
                const meta = CONTACT_META[c.type] ?? {};
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      value={c.type}
                      onChange={(e) => setContact(i, { type: e.target.value })}
                      className="bg-surface border border-border-mid text-white px-2 py-[7px] font-sans text-[12px] rounded-sm outline-none cursor-pointer shrink-0"
                    >
                      {CONTACT_TYPES.map((t) => (
                        <option key={t} value={t} disabled={t !== c.type && usedTypes.has(t)}>
                          {CONTACT_META[t].label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={c.value}
                      onChange={(e) => setContact(i, { value: e.target.value })}
                      placeholder={meta.placeholder}
                      maxLength={80}
                      className="flex-1 min-w-0 bg-surface border border-border-mid text-white px-2.5 py-1.5 font-sans text-[13px] rounded-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => set({ contacts: contacts.filter((_, idx) => idx !== i) })}
                      aria-label="Quitar contacto"
                      className="bg-transparent border-0 text-muted hover:text-danger cursor-pointer p-1 shrink-0 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}

              {freeType && (
                <button
                  type="button"
                  onClick={() => set({ contacts: [...contacts, { type: freeType, value: '' }] })}
                  className="flex items-center gap-1.5 self-start text-[11px] font-mono text-brand hover:text-white cursor-pointer bg-transparent border-0 p-0 transition-colors"
                >
                  <Plus size={13} /> Agregar contacto
                </button>
              )}

              {contacts.length === 0 && inherited?.contacts?.length > 0 && (
                <span className="text-[11px] font-mono text-dim">
                  Sin contactos propios se usan los de la categoría.
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
