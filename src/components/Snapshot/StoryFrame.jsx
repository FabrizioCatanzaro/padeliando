// Marco común para todas las historias exportables (9:16 · 1080x1920).
// Todo con estilos inline en HEX fijos (paleta oscura), sin depender de
// utilidades Tailwind ni del tema claro/oscuro, para que la captura con
// html-to-image sea consistente.

import { STORY_W, STORY_H, C, fonts } from './story-theme';

export default function StoryFrame({
  eyebrow,
  title,
  subtitle,
  accent = C.brand,
  children,
  footerNote = 'padeleando.ar',
}) {
  return (
    <div
      style={{
        width: STORY_W,
        height: STORY_H,
        position: 'relative',
        overflow: 'hidden',
        background: '#000000',
        color: C.white,
        fontFamily: fonts.sans,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Glows de marca */}
      <div style={{
        position: 'absolute', top: -320, left: -220, width: 920, height: 920,
        borderRadius: '50%', background: `radial-gradient(circle, ${accent}26, transparent 68%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -380, right: -240, width: 980, height: 980,
        borderRadius: '50%', background: `radial-gradient(circle, ${accent}14, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ padding: '76px 76px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 56 }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: accent }} />
          <div style={{
            fontFamily: fonts.display, fontWeight: 800, fontSize: 34,
            letterSpacing: 1, color: C.white,
          }}>
            PADELEANDO
          </div>
        </div>

        {eyebrow && (
          <div style={{
            fontSize: 24, letterSpacing: 8, fontWeight: 700,
            color: accent, marginBottom: 18,
          }}>
            {eyebrow}
          </div>
        )}
        {title && (
          <div style={{
            fontFamily: fonts.display, fontWeight: 800, fontSize: 62,
            lineHeight: 1.04, color: C.white, wordBreak: 'break-word',
          }}>
            {title}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: 30, color: C.secondary, marginTop: 18 }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{
        flex: 1, minHeight: 0, padding: '52px 76px 0',
        display: 'flex', flexDirection: 'column', position: 'relative',
      }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{
        padding: '36px 76px 76px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', position: 'relative',
      }}>
        <div style={{ fontSize: 27, color: C.dim, fontWeight: 600 }}>{footerNote}</div>
        <div style={{ fontSize: 24, color: C.faint, letterSpacing: 2 }}>#PADELEANDO</div>
      </div>
    </div>
  );
}

// ── Átomos reutilizables por las historias ─────────────────────────────────────

// Tarjeta de estadística grande (número + etiqueta).
export function StatTile({ value, label, accent = C.brand, sub }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
      padding: '30px 30px 26px', flex: 1, minWidth: 0, overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: fonts.display, fontWeight: 800, fontSize: 66, lineHeight: 1,
        color: accent, whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 24, letterSpacing: 3, color: C.dim, marginTop: 16, fontWeight: 600 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 22, color: C.muted, marginTop: 6 }}>{sub}</div>}
      <div style={{ height: 5, borderRadius: 3, marginTop: 20, background: accent, opacity: 0.4 }} />
    </div>
  );
}
