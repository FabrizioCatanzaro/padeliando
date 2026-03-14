export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #1a1f2e',
      background: '#0a0e1a',
      padding: '24px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
                    fontSize: 15, letterSpacing: 3, color: '#333' }}>
        🎾 PADEL<span style={{ color: '#e8f04a' }}>EANDO</span>
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="mailto:contacto@padeliando.com"
          style={{ fontSize: 12, color: '#444', fontFamily: "'Courier New',monospace",
                   textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
          onMouseLeave={e => e.currentTarget.style.color = '#444'}
        >
          contacto@padeliando.com
        </a>
        <span style={{ fontSize: 11, color: '#2a3040', fontFamily: "'Courier New',monospace" }}>
          © {new Date().getFullYear()} Padeliando
        </span>
      </div>
    </footer>
  )
}
