import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { playTone } from '../../utils/sound'

// La simulación vive en un lienzo lógico fijo y el dibujo se escala al ancho
// real: así la paleta mide lo mismo en un celular que en un monitor.
const W = 360, H = 480
const PADDLE_W = 62, PADDLE_H = 10, PADDLE_Y = H - 34
const R = 7
const SPEED_0 = 4.2, SPEED_MAX = 9.6, TRAIL = 7

const LOST = [
  'Se fue afuera. Como esta página.',
  'A la reja. Pasa en las mejores familias.',
  'Doble falta. La página sigue sin existir.',
  'Esa era tuya, eh.',
  'Punto para la pared.',
]

const readColors = () => {
  const s = getComputedStyle(document.documentElement)
  const v = (n, f) => s.getPropertyValue(n).trim() || f
  return {
    brand:  v('--color-brand', '#e8f04a'),
    court:  v('--color-surface-alt', '#141414'),
    line:   v('--color-border-strong', '#2e2e2e'),
    paddle: v('--color-content', '#cccccc'),
    dim:    v('--color-muted', '#808080'),
  }
}

export default function Fronton({ onScore }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const colors = useRef(readColors())
  const view = useRef({ scale: 1, dpr: 1 })
  const g = useRef({ x: W / 2, y: PADDLE_Y - R - 1, vx: 0, vy: 0, px: W / 2, speed: SPEED_0, trail: [] })

  const [phase, setPhase] = useState('idle')   // idle | playing | paused | over
  const [hits, setHits] = useState(0)
  const [record, setRecord] = useState(() => Number(localStorage.getItem('fronton_record')) || 0)
  const [sound, setSound] = useState(false)
  const [lost, setLost] = useState(LOST[0])

  useEffect(() => { onScore?.(hits) }, [hits, onScore])

  // El tema se cambia agregando .light en <html>, así que los colores se releen
  // ahí y no en cada cuadro.
  useEffect(() => {
    const obs = new MutationObserver(() => { colors.current = readColors() })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const draw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const { scale, dpr } = view.current
    const c = colors.current
    const b = g.current

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)
    ctx.fillStyle = c.court
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = c.line
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, W - 2, H - 2)
    ctx.fillStyle = c.line
    ctx.fillRect(0, 0, W, 10)
    ctx.setLineDash([6, 8])
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(W, 150); ctx.stroke()
    ctx.setLineDash([])

    b.trail.forEach((p, i) => {
      ctx.globalAlpha = ((i + 1) / b.trail.length) * 0.28
      ctx.beginPath(); ctx.arc(p.x, p.y, R * 0.8, 0, Math.PI * 2)
      ctx.fillStyle = c.brand; ctx.fill()
    })
    ctx.globalAlpha = 1

    ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, Math.PI * 2)
    ctx.fillStyle = c.brand; ctx.fill()

    ctx.fillStyle = c.paddle
    if (ctx.roundRect) {
      ctx.beginPath()
      ctx.roundRect(b.px - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H, 5)
      ctx.fill()
    } else {
      ctx.fillRect(b.px - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H)
    }
  }, [])

  const tick = useCallback((dt) => {
    const b = g.current
    b.x += b.vx * dt
    b.y += b.vy * dt

    b.trail.push({ x: b.x, y: b.y })
    if (b.trail.length > TRAIL) b.trail.shift()

    if (b.x - R < 0) { b.x = R; b.vx = -b.vx }
    if (b.x + R > W) { b.x = W - R; b.vx = -b.vx }
    if (b.y - R < 10) { b.y = 10 + R; b.vy = -b.vy }

    const cruza = b.vy > 0 && b.y + R >= PADDLE_Y && b.y - R <= PADDLE_Y + PADDLE_H
    if (cruza && Math.abs(b.x - b.px) <= PADDLE_W / 2 + R) {
      // El punto de impacto decide el ángulo: al centro sale derecha, al borde abre.
      const rel = Math.max(-1, Math.min(1, (b.x - b.px) / (PADDLE_W / 2)))
      const ang = rel * 1.05
      b.speed = Math.min(b.speed + 0.18, SPEED_MAX)
      b.vx = Math.sin(ang) * b.speed
      b.vy = -Math.cos(ang) * b.speed
      b.y = PADDLE_Y - R - 0.5
      setHits(h => h + 1)
      if (sound) playTone([620 + b.speed * 40], 0.05)
    }

    if (b.y - R > H) {
      setPhase('over')
      setLost(LOST[Math.floor(Math.random() * LOST.length)])
      setHits(h => {
        if (h > (Number(localStorage.getItem('fronton_record')) || 0)) {
          localStorage.setItem('fronton_record', String(h))
          setRecord(h)
        }
        return h
      })
      if (sound) playTone([300, 200], 0.09)
    }
  }, [sound])

  useEffect(() => {
    const cv = canvasRef.current, wrap = wrapRef.current
    if (!cv || !wrap) return
    const fit = () => {
      const w = wrap.clientWidth
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      view.current = { scale: w / W, dpr }
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(w * (H / W) * dpr)
      draw()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [draw])

  // El bucle sólo existe mientras se juega: una pestaña abierta en el 404 no
  // debe quedar pidiendo cuadros para siempre.
  useEffect(() => {
    if (phase !== 'playing') { draw(); return }
    let raf, last = performance.now()
    const step = (t) => {
      const dt = Math.min((t - last) / 16.67, 2.5)
      last = t
      tick(dt)
      draw()
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    const onHide = () => { if (document.hidden) setPhase('paused') }
    document.addEventListener('visibilitychange', onHide)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onHide) }
  }, [phase, tick, draw])

  const serve = () => {
    if (phase === 'playing') return
    if (phase === 'paused') { setPhase('playing'); return }
    const b = g.current
    b.speed = SPEED_0
    b.x = b.px
    b.y = PADDLE_Y - R - 1
    b.vx = (Math.random() - 0.5) * 2.4
    b.vy = -SPEED_0
    b.trail = []
    setHits(0)
    setPhase('playing')
  }

  const movePaddle = (x) => {
    const b = g.current
    b.px = Math.max(PADDLE_W / 2, Math.min(W - PADDLE_W / 2, x))
    if (phase !== 'playing') { b.x = b.px; draw() }
  }

  const onPointer = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    movePaddle((e.clientX - rect.left) / view.current.scale)
  }

  const onKey = (e) => {
    if (e.key === 'ArrowLeft')  { movePaddle(g.current.px - 26); e.preventDefault() }
    if (e.key === 'ArrowRight') { movePaddle(g.current.px + 26); e.preventDefault() }
    if (e.key === ' ' || e.key === 'Enter') { serve(); e.preventDefault() }
  }

  const overlay = {
    idle:   { t: 'TOCÁ PARA SACAR', s: 'Movés la paleta con el dedo, el mouse o las flechas' },
    paused: { t: 'EN PAUSA', s: 'Tocá para seguir el punto' },
    over:   { t: `${hits} ${hits === 1 ? 'GOLPE' : 'GOLPES'}`, s: lost },
  }[phase]

  return (
    <div className="w-full max-w-[360px] mx-auto">
      <div ref={wrapRef} className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="application"
          aria-label="Frontón: pelotéa contra la pared moviendo la paleta"
          onPointerMove={onPointer}
          onPointerDown={(e) => { onPointer(e); serve() }}
          onKeyDown={onKey}
          className="w-full h-full block rounded-sm border border-border cursor-none outline-none focus-visible:ring-2 focus-visible:ring-brand"
          style={{ touchAction: 'none' }}
        />

        {overlay && (
          <button
            onClick={serve}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-base/70 backdrop-blur-[2px] rounded-sm cursor-pointer"
          >
            <span className="font-condensed font-bold tracking-widest text-brand text-[20px]">{overlay.t}</span>
            <span className="text-[11px] text-soft px-6 text-center">{overlay.s}</span>
            {phase === 'over' && (
              <span className="mt-3 text-[11px] font-mono uppercase tracking-widest text-muted">Tocá para sacar de nuevo</span>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted">
          Golpes <span className="text-content">{hits}</span>
          <span className="mx-2 text-border-strong">|</span>
          Récord <span className="text-content">{record}</span>
        </p>
        <button
          onClick={() => setSound(s => !s)}
          aria-pressed={sound}
          aria-label={sound ? 'Silenciar el juego' : 'Activar el sonido del juego'}
          className="text-muted hover:text-content transition-colors cursor-pointer p-1"
        >
          {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>
    </div>
  )
}
