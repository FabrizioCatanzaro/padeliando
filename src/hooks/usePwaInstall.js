import { useSyncExternalStore } from 'react'
import { canInstall, isIosSafari, promptInstall, snooze, subscribe } from '../utils/pwa'

export function usePwaInstall() {
  const available = useSyncExternalStore(subscribe, canInstall, () => false)

  // install y dismiss viven en el módulo: ya son estables entre renders.
  return { available, needsManualSteps: isIosSafari(), install: promptInstall, dismiss: snooze }
}
