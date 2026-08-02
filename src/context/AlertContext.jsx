import { useState, useCallback, useRef } from 'react'
import { AlertContext } from './useAlerts'
import AlertStack from '../components/shared/AlertStack'

// Uno solo: dos stacks fijos se pisarían en /view/:id.
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
