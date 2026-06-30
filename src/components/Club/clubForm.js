// Helpers puros para convertir entre el shape del form y el de la API (clubs).

const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'website']

// Estado inicial del form a partir de un club/solicitud existente (o vacío).
export function clubToForm(club = {}) {
  const social = Array.isArray(club.social_links) ? club.social_links : []
  const get = (platform) => social.find((s) => s.platform === platform)?.url ?? ''
  const schedule = Array.isArray(club.schedule) ? club.schedule : []
  return {
    name:             club.name ?? '',
    location_name:    club.location_name ?? '',
    contact_phone:    club.contact_phone ?? '',
    contact_whatsapp: club.contact_whatsapp ?? '',
    courts:           club.courts ?? '',
    instagram:        get('instagram'),
    facebook:         get('facebook'),
    website:          get('website'),
    scheduleText:     schedule.map((s) => (typeof s === 'string' ? s : s.text ?? '')).filter(Boolean).join('\n'),
    lat:              club.lat ?? null,
    lon:              club.lon ?? null,
  }
}

// Normaliza un WhatsApp a formato de visualización argentino "+54...".
// Saca separadores y ceros iniciales (011 → 11) y antepone +54 si falta.
export function normalizeWhatsappDisplay(raw) {
  if (!raw) return null
  let digits = String(raw).replace(/\D/g, '').replace(/^0+/, '')
  if (!digits) return null
  return digits.startsWith('54') ? `+${digits}` : `+54${digits}`
}

// Link wa.me a partir de cualquier formato: garantiza el prefijo "549".
export function whatsappLink(raw) {
  if (!raw) return ''
  let digits = String(raw).replace(/\D/g, '').replace(/^0+/, '')
  if (!digits) return ''
  if (digits.startsWith('549'))      { /* ya tiene 549 */ }
  else if (digits.startsWith('54'))  digits = `549${digits.slice(2)}`
  else                               digits = `549${digits}`
  return `https://wa.me/${digits}`
}

// URL absoluta de una red social a partir del valor guardado (URL o @handle).
export function socialUrl(s) {
  const url = (s?.url ?? '').trim()
  if (!url) return '#'
  if (url.startsWith('http')) return url
  const handle = url.replace(/^@/, '')
  if (s.platform === 'instagram') return `https://instagram.com/${handle}`
  if (s.platform === 'facebook')  return `https://facebook.com/${handle}`
  return `https://${handle}`
}

// Texto a mostrar para una red social (handle de Instagram o dominio).
export function socialLabel(s) {
  const url = (s?.url ?? '').trim()
  if (s.platform === 'instagram') {
    if (url.startsWith('http')) return '@' + url.replace(/\/+$/, '').split('/').pop()
    return url.startsWith('@') ? url : `@${url}`
  }
  return url.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

// Convierte el estado del form al body que espera la API.
export function formToClub(f) {
  const social_links = SOCIAL_PLATFORMS
    .map((platform) => ({ platform, url: (f[platform] ?? '').trim() }))
    .filter((s) => s.url)
  const schedule = (f.scheduleText ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => ({ text }))
  return {
    name:             f.name?.trim() ?? '',
    location_name:    f.location_name?.trim() || null,
    contact_phone:    f.contact_phone?.trim() || null,
    contact_whatsapp: normalizeWhatsappDisplay(f.contact_whatsapp),
    courts:           f.courts === '' || f.courts == null ? null : Number(f.courts),
    social_links,
    schedule,
    lat:              f.lat ?? null,
    lon:              f.lon ?? null,
  }
}

// Para mostrar el horario de un club como líneas de texto.
export function scheduleLines(schedule) {
  if (!Array.isArray(schedule)) return []
  return schedule.map((s) => (typeof s === 'string' ? s : s.text ?? '')).filter(Boolean)
}
