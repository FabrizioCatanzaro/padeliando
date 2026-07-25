// Renderiza el subconjunto de Markdown de los mensajes de admin a nodos de React.
// Debe mantenerse en sincronía con el parser del backend (padeliando-api/src/lib/richText.js):
//   **negrita**   *itálica*  _itálica_   [texto](url)   y saltos de línea.

// Solo permitimos enlaces http(s) y mailto.
function safeHref(url) {
  return /^(https?:\/\/|mailto:)/i.test(url) ? url : null
}

const INLINE_RE =
  /(\*\*([^*]+?)\*\*)|(\*([^*]+?)\*)|(_([^_]+?)_)|(\[([^\]]+?)\]\(([^)\s]+?)\))/g

function parseInline(text) {
  const tokens = []
  let last = 0
  let m
  INLINE_RE.lastIndex = 0
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) tokens.push({ type: 'text', value: text.slice(last, m.index) })
    if (m[2] != null)      tokens.push({ type: 'bold',   value: m[2] })
    else if (m[4] != null) tokens.push({ type: 'italic', value: m[4] })
    else if (m[6] != null) tokens.push({ type: 'italic', value: m[6] })
    else if (m[8] != null) {
      const href = safeHref(m[9])
      tokens.push(href ? { type: 'link', value: m[8], href } : { type: 'text', value: m[0] })
    }
    last = INLINE_RE.lastIndex
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) })
  return tokens
}

// Devuelve un array de nodos React con el texto formateado.
// linkClass permite adaptar el estilo del link según el contexto.
export function renderRichText(md, { linkClass = 'text-brand underline hover:opacity-80' } = {}) {
  const lines = String(md ?? '').split('\n')
  const nodes = []
  lines.forEach((line, li) => {
    if (li > 0) nodes.push(<br key={`br-${li}`} />)
    parseInline(line).forEach((tok, ti) => {
      const key = `${li}-${ti}`
      if (tok.type === 'bold') nodes.push(<strong key={key}>{tok.value}</strong>)
      else if (tok.type === 'italic') nodes.push(<em key={key}>{tok.value}</em>)
      else if (tok.type === 'link')
        nodes.push(
          <a
            key={key}
            href={tok.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClick={(e) => e.stopPropagation()}
          >
            {tok.value}
          </a>,
        )
      else nodes.push(<span key={key}>{tok.value}</span>)
    })
  })
  return nodes
}
