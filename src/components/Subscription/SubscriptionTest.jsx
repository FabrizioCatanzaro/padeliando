import { useState, useEffect } from 'react'
import { api } from '../../utils/api'

const PLANS = [
  { key: 'monthly',   label: 'Mensual',    price: '$3500 ARS/mes' },
  { key: 'annual',    label: 'Anual',      price: '$76800 ARS/año' },
]

export default function SubscriptionTest() {
  const [sub, setSub]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [working, setWorking] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.subscriptions.me()
      setSub(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCheckout(period) {
    setWorking(true)
    setError(null)
    try {
      const data = await api.subscriptions.checkout(period)
      window.location.href = data.init_point
    } catch (e) {
      setError(e.message)
      setWorking(false)
    }
  }

  async function handleCancel() {
    if (!confirm('¿Cancelar suscripción?')) return
    setWorking(true)
    setError(null)
    try {
      await api.subscriptions.cancel()
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', maxWidth: 500 }}>
      <h2>TEST — Suscripciones MP</h2>

      <section style={{ marginBottom: 24, padding: 12, border: '1px solid #444', borderRadius: 6 }}>
        <strong>Estado actual</strong>
        {loading && <p>Cargando...</p>}
        {!loading && !error && sub && (
          <pre style={{ margin: '8px 0 0', fontSize: 12 }}>
            {JSON.stringify(sub, null, 2)}
          </pre>
        )}
        {error && <p style={{ color: 'tomato' }}>{error}</p>}
        <button onClick={load} disabled={loading} style={{ marginTop: 8 }}>
          Recargar
        </button>
      </section>

      <section style={{ marginBottom: 24 }}>
        <strong>Iniciar suscripción</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {PLANS.map(p => (
            <button
              key={p.key}
              onClick={() => handleCheckout(p.key)}
              target={'_blank'}
              disabled={working}
              style={{ padding: '8px 14px', cursor: 'pointer' }}
            >
              {p.label}<br />
              <small>{p.price}</small>
            </button>
          ))}
        </div>
      </section>

      {sub?.status === 'active' && sub?.mp_preapproval_id && (
        <section>
          <button
            onClick={handleCancel}
            disabled={working}
            style={{ padding: '8px 14px', background: 'tomato', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Cancelar suscripción
          </button>
        </section>
      )}
    </div>
  )
}
