import { useContext, createContext } from 'react'

export const AlertContext = createContext(null)

export function useAlerts() {
  return useContext(AlertContext) ?? { pushAlert: () => {} }
}
