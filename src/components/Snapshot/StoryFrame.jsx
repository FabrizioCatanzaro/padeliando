// Marco común para todas las historias exportables (9:16 · 1080x1920).
// Todo con estilos inline en HEX fijos (paleta oscura), sin depender de
// utilidades Tailwind ni del tema claro/oscuro, para que la captura con
// html-to-image sea consistente.

import { STORY_W, STORY_H, C, fonts } from './story-theme';
import { tournamentDate } from '../../utils/helpers';
import logoTxtUrl from '../../assets/padeleando-txt-hd.webp';

export default function StoryFrame({
  eyebrow,
  title,
  subtitle,
  meta,
  headerRight,
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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 24, marginBottom: 56,
        }}>
          <img src={logoTxtUrl} alt="Padeleando" style={{ height: 64, display: 'block', flexShrink: 0 }} />
          {headerRight}
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
        {meta}
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
        <div style={{ fontSize: 24, fontFamily: fonts.sans, color: C.muted, letterSpacing: 2 }}>Todas tus estadísticas de padel en</div>
        <div style={{ fontSize: 30, fontFamily: fonts.display, color: C.dim, fontWeight: 600 }}>{footerNote}</div>
      </div>
    </div>
  );
}

// ── Átomos reutilizables por las historias ─────────────────────────────────────

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// La fecha llega como YYYY-MM-DD y se parte a mano: `new Date` la correría un
// día hacia atrás en los husos al oeste de UTC.
function storyDate(t) {
  const [y, m, d] = tournamentDate(t ?? {}).split('-');
  if (!y || !m || !d) return null;
  return `${Number(d)} ${MESES[Number(m) - 1]} ${y}`;
}

// Categoría a la que pertenece el torneo y fecha en que se jugó, como píldoras
// hermanas. Va en el slot `meta` del StoryFrame, debajo del título.
export function TournamentMeta({ tournament, accent = C.brand }) {
  const groupName = tournament?.group_name;
  const date      = storyDate(tournament);
  if (!groupName && !date) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginTop: 22 }}>
      {groupName && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, minWidth: 0,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 999, padding: '10px 22px 10px 12px',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: `${accent}1f`, border: `1px solid ${accent}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: accent,
          }}>
            {groupName.trim().charAt(0).toUpperCase()}
          </div>
          <div style={{
            fontSize: 24, fontWeight: 600, color: C.soft, maxWidth: 520,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {groupName}
          </div>
        </div>
      )}
      {date && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          background: C.surface, border: `1px solid ${accent}33`,
          borderRadius: 999, padding: '10px 24px',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, flexShrink: 0 }} />
          <div style={{
            fontFamily: fonts.display, fontSize: 24, fontWeight: 700,
            letterSpacing: 2, color: C.white, whiteSpace: 'nowrap',
          }}>
            {date}
          </div>
        </div>
      )}
    </div>
  );
}

// Insignia del club: foto + nombre. Va en el slot `headerRight` del StoryFrame,
// a la misma altura que el logo. Si el club no tiene foto cargada, cae a su inicial.
export function ClubBadge({ tournament }) {
  const clubName  = tournament?.club_name;
  const clubPhoto = tournament?.club_photo_url;
  if (!clubName) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, minWidth: 0,
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 999, padding: '6px 26px 6px 6px',
    }}>
      {clubPhoto ? (
        <img
          src={clubPhoto}
          alt=""
          style={{
            width: 52, height: 52, borderRadius: '50%', objectFit: 'cover',
            display: 'block', flexShrink: 0, border: `1px solid ${C.borderS}`,
          }}
        />
      ) : (
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: C.surface2, border: `1px solid ${C.borderS}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: fonts.display, fontSize: 22, fontWeight: 800, color: C.soft,
        }}>
          {clubName.trim().charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{
        fontSize: 26, fontWeight: 700, color: C.white, maxWidth: 420,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {clubName}
      </div>
    </div>
  );
}

// Tarjeta de highlight (etiqueta + valor principal + subtítulo).
// `mainSize` pisa el tamaño del valor: se usa cuando el texto es largo por un
// empate (varios nombres unidos con " / ") y al tamaño normal no entraría.
export function HighlightCard({ label, main, sub, accent = C.brand, emoji, big, mainSize, subSize }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${accent}44`, borderRadius: 20,
      padding: big ? '34px 36px' : '28px 30px', flex: 1, minWidth: 0, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {emoji && <span style={{ fontSize: big ? 40 : 30, lineHeight: 1 }}>{emoji}</span>}
        <span style={{ fontSize: 22, letterSpacing: 3, color: accent, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{
        fontFamily: fonts.display, fontWeight: 800, color: C.white,
        fontSize: mainSize ?? (big ? 54 : 40),
        // Interlineado más suelto sólo en el caso reducido, que es el que parte
        // en varias líneas; el tamaño normal casi siempre entra en una.
        lineHeight: mainSize ? 1.2 : 1.05,
        wordBreak: 'break-word',
      }}>
        {main}
      </div>
      {/* `subSize` lo baja el call site cuando el sub son nombres de los 4
          jugadores, que al tamaño normal parten en tres líneas. */}
      {sub && <div style={{ fontSize: subSize ?? 24, color: C.secondary, marginTop: 10 }}>{sub}</div>}
    </div>
  );
}

// Tarjeta de estadística grande (número + etiqueta).
// `valueSize` lo baja el call site cuando el valor es texto (un nombre de club,
// una duración) y al tamaño de un número no entraría en el ancho de la tarjeta.
export function StatTile({ value, label, accent = C.brand, sub, valueSize }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
      padding: '30px 30px 26px', flex: 1, minWidth: 0, overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: fonts.display, fontWeight: 800, fontSize: valueSize ?? 66, lineHeight: 1,
        color: accent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
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
