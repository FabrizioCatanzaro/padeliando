import { useState, useCallback, useRef } from 'react'
import { AlertContext } from './useAlerts'
import AlertStack from '../components/shared/AlertStack'

// Un único stack para los avisos flotantes: los del torneo (ReadonlyView) y los
// de la campana (Header) comparten pila, si no se pisarían en /view/:id.
const MAX_VISIBLE = 3

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([])
  const seqRef = useRef(0)

  const dismiss = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  const pushAlert = useCallback((alert) => {
    const id = `al-${Date.now()}-${seqRef.current++}`
    setAlerts(prev => [...prev, { ...alert, id }].slice(-MAX_VISIBLE))
    return id
  }, [])

  return (
    <AlertContext.Provider value={{ pushAlert, dismiss }}>
      {children}
      <AlertStack alerts={alerts} onDismiss={dismiss} />
    </AlertContext.Provider>
  )
}
