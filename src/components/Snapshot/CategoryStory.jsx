import StoryFrame, { HighlightCard } from './StoryFrame';
import { C, fonts } from './story-theme';

// Bloque con título de sección (mismo tono que los encabezados de la app).
function Section({ title, children }) {
  return (
    <div>
      <div style={{
        fontSize: 22, letterSpacing: 4, fontWeight: 700,
        color: C.muted, marginBottom: 14,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// Tarjeta de número suelto. Sólo la usa el layout free, donde sobra espacio.
function NumberTile({ value, label, accent = C.brand }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${accent}44`, borderRadius: 20,
      padding: '38px 34px', flex: 1, minWidth: 0, overflow: 'hidden', textAlign: 'center',
    }}>
      <div style={{
        fontFamily: fonts.display, fontWeight: 800, color: C.white,
        fontSize: 96, lineHeight: 1, whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 26, letterSpacing: 3, color: accent, fontWeight: 700, marginTop: 16 }}>
        {label}
      </div>
    </div>
  );
}

// Fila del ranking histórico: puesto · nombre · ganados/perdidos · win rate.
function RankRow({ row, index }) {
  const isTop = index === 0;
  const pctColor = row.pct >= 50 ? C.brand : C.danger;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 18,
      background: isTop ? `${C.brand}12` : C.surface,
      border: `1px solid ${isTop ? `${C.brand}55` : C.border}`,
      borderRadius: 14, padding: '9px 22px',
    }}>
      <div style={{
        width: 40, flexShrink: 0, textAlign: 'center',
        fontFamily: fonts.display, fontWeight: 800, fontSize: 24,
        color: isTop ? C.brand : C.dim,
      }}>
        {index + 1}
      </div>
      <div style={{
        flex: 1, minWidth: 0, fontSize: 26, fontWeight: 600, color: C.white,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {row.name}
      </div>
      {/* Ganados en color de marca: es el criterio con el que está ordenado. */}
      <div style={{
        width: 72, flexShrink: 0, textAlign: 'right', fontSize: 24,
        fontWeight: 700, color: C.brand,
      }}>
        {row.pg}G
      </div>
      <div style={{ width: 66, flexShrink: 0, textAlign: 'right', fontSize: 24, color: C.dim }}>
        {row.pj - row.pg}P
      </div>
      <div style={{
        width: 88, flexShrink: 0, textAlign: 'right',
        fontFamily: fonts.display, fontWeight: 700, fontSize: 26, color: pctColor,
      }}>
        {row.pct}%
      </div>
    </div>
  );
}

// Gráfico de campeones: barras horizontales proporcionales al máximo de títulos.
function ChampionsChart({ rows }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map((r) => (
        <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 280, flexShrink: 0, fontSize: 24, color: C.soft,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {r.name}
          </div>
          <div style={{ flex: 1, minWidth: 0, height: 18, borderRadius: 9, background: C.surface2 }}>
            <div style={{
              width: `${(r.count / max) * 100}%`, height: '100%',
              borderRadius: 9, background: C.brand,
            }} />
          </div>
          <div style={{
            width: 44, flexShrink: 0, textAlign: 'right',
            fontFamily: fonts.display, fontWeight: 800, fontSize: 26, color: C.brand,
          }}>
            {r.count}
          </div>
        </div>
      ))}
    </div>
  );
}

// Historia exportable de una categoría.
// El contenido depende del plan del DUEÑO de la categoría (igual que la vista in-app):
//   free    → sólo las básicas (torneos, partidos, más veces campeón)
//   premium → básicas + avanzadas + ranking histórico (top 10) + gráfico de campeones
export default function CategoryStory({
  groupName,
  tournamentsCount = 0,
  totalMatches = 0,
  isPremium = false,
  champion = null,   // { label, count, tied }
  bestPlayer = null, // { name, wins }
  bestPair = null,   // { label, record, tied }
  ranking = [],      // [{ key, name, pj, pg, pct }] — ya recortado a 10
  rankingTitle = 'RANKING HISTÓRICO',
  champions = [],    // [{ name, count }] — ya recortado a 5
}) {
  const frameProps = {
    eyebrow: 'ESTADÍSTICAS DE LA CATEGORÍA',
    title: groupName ?? 'Histórico',
    accent: C.brand,
  };

  // ── Free: las básicas, centradas verticalmente para que no quede aire abajo.
  // Sin subtítulo: los totales ya se leen en las tarjetas de abajo. ───────────
  if (!isPremium) {
    return (
      <StoryFrame {...frameProps}>
        <div style={{
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', gap: 26,
        }}>
          {champion && (
            <HighlightCard
              big
              emoji="🏆"
              label={champion.tied ? 'MÁS VECES CAMPEONES' : 'MÁS VECES CAMPEÓN'}
              main={champion.label}
              sub={`${champion.count} ${champion.count === 1 ? 'torneo' : 'torneos'}`}
              accent={C.amber}
            />
          )}
          <div style={{ display: 'flex', gap: 26 }}>
            <NumberTile value={tournamentsCount} label="TORNEOS" accent={C.cyan} />
            <NumberTile value={totalMatches} label="PARTIDOS" accent={C.green} />
          </div>
        </div>
      </StoryFrame>
    );
  }

  // ── Premium: básicas + avanzadas + ranking + campeones.
  // Los totales van en el subtítulo en vez de en tarjetas propias: el layout ya
  // carga con el ranking y el gráfico, y así no queda todo apretado. ──────────
  return (
    <StoryFrame
      {...frameProps}
      subtitle={`${tournamentsCount} ${tournamentsCount === 1 ? 'torneo' : 'torneos'} · ${totalMatches} ${totalMatches === 1 ? 'partido' : 'partidos'}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Básicas */}
        {champion && (
          <div style={{ display: 'flex' }}>
            <HighlightCard
              emoji="🏆"
              label={champion.tied ? 'MÁS VECES CAMPEONES' : 'MÁS VECES CAMPEÓN'}
              main={champion.label}
              sub={`${champion.count} ${champion.count === 1 ? 'torneo' : 'torneos'}`}
              accent={C.amber}
            />
          </div>
        )}

        {/* Avanzadas */}
        {(bestPlayer || bestPair) && (
          <div style={{ display: 'flex', gap: 20 }}>
            {bestPlayer && (
              <HighlightCard
                emoji="👑"
                label="MEJOR JUGADOR"
                main={bestPlayer.name}
                sub={`${bestPlayer.wins}V`}
                accent={C.brand}
              />
            )}
            {bestPair && (
              <HighlightCard
                emoji="🤝"
                label={bestPair.tied ? 'MEJOR PAREJA · EMPATE' : 'MEJOR PAREJA'}
                main={bestPair.label}
                // En empate el valor son varias parejas (4 nombres o más): baja
                // el tamaño para que entren sin desbordar la tarjeta.
                mainSize={bestPair.tied ? 26 : undefined}
                sub={bestPair.record ?? undefined}
                accent={C.green}
              />
            )}
          </div>
        )}

        {/* Ranking histórico */}
        {ranking.length > 0 && (
          <Section title={rankingTitle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ranking.map((r, i) => <RankRow key={r.key} row={r} index={i} />)}
            </div>
          </Section>
        )}

        {/* Gráfico de campeones */}
        {champions.length > 0 && (
          <Section title="CAMPEONES">
            <ChampionsChart rows={champions} />
          </Section>
        )}
      </div>
    </StoryFrame>
  );
}
