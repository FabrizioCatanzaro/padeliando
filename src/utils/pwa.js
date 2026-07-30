// Estado de instalación de la PWA, fuera de React: el navegador dispara
// `beforeinstallprompt` durante la carga, mucho antes de que monte el árbol,
// así que si esperáramos a un useEffect el evento se perdería.

const KEY_UNTIL = 'pwa_dismissed_until'
const KEY_COUNT = 'pwa_dismiss_count'
const DISMISS_DAYS = 7

let deferred = null
let installed = false
const listeners = new Set()

function emit() {
  for (const fn of listeners) fn()
}

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

// En iOS no existe `beforeinstallprompt`: instalar es manual y sólo desde
// Safari, así que ahí el cartel muestra instrucciones en vez de un botón.
export function isIosSafari() {
  const ua = navigator.userAgent
  const ios = /iphone|ipad|ipod/i.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return ios && !/crios|fxios|edgios|opios/i.test(ua)
}

function read(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

function write(key, value) {
  try { localStorage.setItem(key, value) } catch { /* modo privado */ }
}

export function isSnoozed() {
  if (Number(read(KEY_COUNT) ?? 0) >= 2) return true
  const until = Number(read(KEY_UNTIL) ?? 0)
  return until > Date.now()
}

export function snooze() {
  write(KEY_UNTIL, String(Date.now() + DISMISS_DAYS * 86_400_000))
  write(KEY_COUNT, String(Number(read(KEY_COUNT) ?? 0) + 1))
}

export const OPEN_EVENT = 'pwa:open-install'

// Abre el cartel a pedido del usuario, salteando el descarte de 7 días.
export function openInstallPrompt() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function canInstall() {
  if (installed || isStandalone()) return false
  return deferred !== null || isIosSafari()
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Devuelve 'accepted' | 'dismissed' | null (iOS, donde no hay diálogo nativo).
export async function promptInstall() {
  if (!deferred) return null
  const event = deferred
  deferred = null
  emit()
  event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    emit()
  })
}
