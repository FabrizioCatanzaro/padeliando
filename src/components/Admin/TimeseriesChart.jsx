import { useMemo, useRef, useState } from 'react'

const SERIES = [
  { key: 'users',       label: 'Usuarios',  color: '#e8f04a' }, // brand
  { key: 'tournaments', label: 'Torneos',   color: '#4ab8f0' }, // cyan
  { key: 'matches',     label: 'Partidos',  color: '#4af07a' }, // green
]

const PAD = { top: 16, right: 12, bottom: 24, left: 28 }
const W   = 720
const H   = 240

function fmtShort(s) {
  const d = new Date(s)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

export default function TimeseriesChart({ points }) {
  const svgRef = useRef(null)
  const [hoverIdx, setHoverIdx] = useState(null)

  const { yMax, plotW, xFor, yFor, totals } = useMemo(() => {
    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top  - PAD.bottom
    const max   = Math.max(1, ...points.flatMap(p => SERIES.map(s => p[s.key] ?? 0)))
    const totals = SERIES.reduce((acc, s) => {
      acc[s.key] = points.reduce((sum, p) => sum + (p[s.key] ?? 0), 0)
      return acc
    }, {})
    return {
      yMax: max,
      plotW, plotH,
      totals,
      xFor: (i) => points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW,
      yFor: (v) => plotH - (v / max) * plotH,
    }
  }, [points])

  function handleMouseMove(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W - PAD.left
    if (x < 0 || x > plotW) { setHoverIdx(null); return }
    const idx = points.length <= 1 ? 0 : Math.round((x / plotW) * (points.length - 1))
    setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)))
  }

  if (!points || points.length === 0) {
    return <p className="text-muted text-xs font-mono">Sin datos</p>
  }

  const yTicks = 4
  const tickLabels = []
  for (let i = 0; i <= yTicks; i++) tickLabels.push(Math.round((yMax / yTicks) * i))

  // Etiquetas de fecha — mostrar primer, último y algunos en el medio
  const labelEvery = Math.max(1, Math.floor(points.length / 6))

  const hover = hoverIdx !== null ? points[hoverIdx] : null

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="font-condensed font-bold text-[12px] tracking-[3px] text-muted">
          ÚLTIMOS {points.length} DÍAS
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          {SERIES.map(s => (
            <div key={s.key} className="flex items-center gap-1.5 text-muted">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span>{s.label}</span>
              <span className="text-white font-bold">{totals[s.key]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Y grid + ticks */}
          {tickLabels.map((v, i) => {
            const y = PAD.top + yFor(v)
            return (
              <g key={i}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                  stroke="#222" strokeWidth="1" strokeDasharray="2 3" />
                <text x={PAD.left - 6} y={y + 3} textAnchor="end" fontSize="9"
                  fill="#666" fontFamily="monospace">{v}</text>
              </g>
            )
          })}

          {/* X labels */}
          {points.map((p, i) => {
            if (i % labelEvery !== 0 && i !== points.length - 1) return null
            return (
              <text key={i} x={PAD.left + xFor(i)} y={H - 6}
                textAnchor="middle" fontSize="9" fill="#666" fontFamily="monospace">
                {fmtShort(p.date)}
              </text>
            )
          })}

          {/* Vertical hover line */}
          {hover && (
            <line
              x1={PAD.left + xFor(hoverIdx)} x2={PAD.left + xFor(hoverIdx)}
              y1={PAD.top} y2={H - PAD.bottom}
              stroke="#444" strokeWidth="1"
            />
          )}

          {/* Series lines */}
          {SERIES.map(s => {
            const pts = points.map((p, i) =>
              `${PAD.left + xFor(i)},${PAD.top + yFor(p[s.key] ?? 0)}`
            ).join(' ')
            return (
              <g key={s.key}>
                <polyline points={pts} fill="none" stroke={s.color} strokeWidth="1.5"
                  strokeLinejoin="round" strokeLinecap="round" />
                {hoverIdx !== null && (
                  <circle
                    cx={PAD.left + xFor(hoverIdx)}
                    cy={PAD.top + yFor(points[hoverIdx][s.key] ?? 0)}
                    r="3" fill={s.color}
                  />
                )}
              </g>
            )
          })}
        </svg>

        {hover && (
          <div
            className="absolute top-0 bg-base border border-border-strong rounded p-2 pointer-events-none text-[11px] font-mono"
            style={{
              left: `calc(${(PAD.left + xFor(hoverIdx)) / W * 100}% + 8px)`,
              maxWidth: '160px',
            }}
          >
            <div className="text-white font-semibold mb-1">{fmtShort(hover.date)}</div>
            {SERIES.map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-muted">{s.label}:</span>
                <span className="text-white">{hover[s.key] ?? 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
