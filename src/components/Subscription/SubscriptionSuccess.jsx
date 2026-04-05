import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'

export default function SubscriptionSuccess() {
  const [sub, setSub]       = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    try {
      const data = await api.subscriptions.me()
      setSub(data)
    } catch (err) {
      console.log(err);
    }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const isActive = sub?.status === 'active' && sub?.plan === 'premium'

  return (
    <div style={{ padding: 32, fontFamily: 'monospace', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: 24 }}>¡Gracias por suscribirte!</h2>
      <p style={{ color: '#aaa' }}>
        Tu pago fue procesado. La activación puede tardar unos segundos mientras Mercado Pago confirma el pago.
      </p>

      <div style={{ margin: '24px 0', padding: 16, border: '1px solid #444', borderRadius: 8 }}>
        {loading && <p>Verificando estado...</p>}
        {!loading && sub && (
          <>
            <p>
              <strong>Plan:</strong> {sub.plan} {sub.billing_period ? `(${sub.billing_period})` : ''}
            </p>
            <p>
              <strong>Estado:</strong>{' '}
              <span style={{ color: isActive ? '#4caf50' : '#ff9800' }}>
                {isActive ? 'Activo' : sub.status === 'pending' ? 'Pendiente de confirmación' : sub.status}
              </span>
            </p>
            {sub.ends_at && (
              <p><strong>Vence:</strong> {new Date(sub.ends_at).toLocaleDateString()}</p>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={load} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Refrescar estado
        </button>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Ir al inicio
        </button>
      </div>
    </div>
  )
}
