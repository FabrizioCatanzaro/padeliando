import StoryFrame from './StoryFrame';
import { C, fonts } from './story-theme';

// Cuántas filas entran en el alto de la historia (1920) sin apretar el footer.
// Pasado ese corte el snapshot deja de leerse, así que se recorta y se avisa.
export const RANKING_STORY_LIMIT = 14;

// Alto útil del cuerpo una vez descontados header, footer y la fila de columnas.
const BODY_H = 1180;
const GAP = 12;

// El alto de fila sale de repartir ese espacio entre las filas que haya, así que
// un ranking de 6 y uno de 14 llenan la imagen igual en vez de dejar un hueco.
function metrics(count) {
  const name = count <= 6 ? 34 : count <= 9 ? 30 : count <= 12 ? 28 : 26;
  const contentH = Math.round(name * 1.35) + 2;
  const padY = Math.min(42, Math.max(10,
    Math.round((BODY_H - (count - 1) * GAP - count * contentH) / (2 * count))
  ));
  return {
    pad: `${padY}px 22px`,
    name,
    num: Math.round(name * 0.9),
    pct: Math.round(name * 1.02),
    rank: Math.round(name * 0.95),
    gap: GAP,
  };
}

// Tamaño de nombre que entra en la columna: las parejas son dos nombres unidos
// con " & " y al tamaño base se cortaban con elipsis.
function fitName(rows, base) {
  const longest = rows.reduce((acc, r) => Math.max(acc, r.name.length), 0);
  if (longest <= 34) return base;
  return Math.max(18, Math.round((base * 34) / longest));
}

// Historia exportable del ranking histórico de una categoría.
// Refleja los dos selectores de la tabla in-app: jugadores/parejas y ganados/rendimiento.
export default function RankingStory({
  groupName,
  rows = [],           // [{ key, name, pj, pg, pct }] ya ordenado según `mode`
  mode = 'wins',       // 'wins' | 'winrate' — define qué columna se resalta
  scope = 'players',   // 'players' | 'pairs'
  tournamentsCount = 0,
  hiddenCount = 0,     // cuántos quedaron afuera del corte
  note = null,         // aclaración al pie (p. ej. jornadas de parejas contadas)
}) {
  const m = metrics(rows.length);
  const nameSize = fitName(rows, m.name);
  const byWins = mode === 'wins';

  const scopeLabel = scope === 'pairs' ? 'Parejas' : 'Jugadores';
  const modeLabel  = byWins ? 'Por partidos ganados' : 'Por rendimiento';

  return (
    <StoryFrame
      eyebrow="RANKING HISTÓRICO"
      title={groupName ?? 'Histórico'}
      subtitle={`${scopeLabel} · ${modeLabel}`}
      accent={C.brand}
    >
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, letterSpacing: 3, color: C.muted, fontWeight: 700 }}>
            {tournamentsCount} {tournamentsCount === 1 ? 'JORNADA' : 'JORNADAS'}
          </div>
          {/* Encabezado de columnas: sin él, "103 62 62%" no se interpreta solo.
              El padding derecho compensa el de las filas para que quede a plomo. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingRight: 23, fontSize: 20, color: C.muted, letterSpacing: 2 }}>
            <div style={{ width: 72, textAlign: 'right' }}>GAN</div>
            <div style={{ width: 66, textAlign: 'right' }}>PER</div>
            <div style={{ width: 88, textAlign: 'right' }}>%</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: m.gap }}>
          {rows.map((r, i) => {
            const isTop = i === 0;
            // La columna que ordena va en color de marca; la otra queda apagada.
            const winsColor = byWins ? C.brand : C.soft;
            const pctColor  = byWins ? (r.pct >= 50 ? C.soft : C.danger) : C.brand;
            return (
              <div key={r.key} style={{
                display: 'flex', alignItems: 'center', gap: 18,
                background: isTop ? `${C.brand}12` : C.surface,
                border: `1px solid ${isTop ? `${C.brand}55` : C.border}`,
                borderRadius: 14, padding: m.pad,
              }}>
                <div style={{
                  width: 44, flexShrink: 0, textAlign: 'center',
                  fontFamily: fonts.display, fontWeight: 800, fontSize: m.rank,
                  color: isTop ? C.brand : C.dim,
                }}>
                  {i + 1}
                </div>
                <div style={{
                  flex: 1, minWidth: 0, fontSize: nameSize, fontWeight: 600, color: C.white,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {r.name}
                </div>
                <div style={{
                  width: 72, flexShrink: 0, textAlign: 'right',
                  fontSize: m.num, fontWeight: 700, color: winsColor,
                }}>
                  {r.pg}
                </div>
                <div style={{ width: 66, flexShrink: 0, textAlign: 'right', fontSize: m.num, color: C.dim }}>
                  {r.pj - r.pg}
                </div>
                <div style={{
                  width: 88, flexShrink: 0, textAlign: 'right',
                  fontFamily: fonts.display, fontWeight: 700, fontSize: m.pct, color: pctColor,
                }}>
                  {r.pct}%
                </div>
              </div>
            );
          })}
        </div>

        {(hiddenCount > 0 || note) && (
          <div style={{ fontSize: 22, color: C.dim, textAlign: 'center' }}>
            {hiddenCount > 0
              ? `+${hiddenCount} ${scope === 'pairs' ? (hiddenCount === 1 ? 'pareja más' : 'parejas más') : (hiddenCount === 1 ? 'jugador más' : 'jugadores más')}`
              : note}
          </div>
        )}
      </div>
    </StoryFrame>
  );
}
