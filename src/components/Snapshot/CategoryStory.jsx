import StoryFrame, { HighlightCard, StatTile } from './StoryFrame';
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

// Tamaño de fuente que entra en el ancho disponible: los nombres de pareja son
// dos nombres unidos con " & " y al tamaño base desbordaban con elipsis.
function fitSize(texts, { base, min, fitChars }) {
  const longest = texts.reduce((acc, t) => Math.max(acc, (t ?? '').length), 0);
  if (longest <= fitChars) return base;
  return Math.max(min, Math.round((base * fitChars) / longest));
}

// Tarjeta de número suelto. Sólo la usa el layout free, donde sobra espacio.
function NumberTile({ value, label, sub, accent = C.brand }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${accent}44`, borderRadius: 20,
      padding: '32px 28px', flex: 1, minWidth: 0, overflow: 'hidden', textAlign: 'center',
    }}>
      <div style={{
        fontFamily: fonts.display, fontWeight: 800, color: C.white,
        fontSize: 84, lineHeight: 1, whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 24, letterSpacing: 3, color: accent, fontWeight: 700, marginTop: 14 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 21, color: C.dim, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

// Fila del ranking histórico: puesto · nombre · ganados/perdidos · win rate.
function RankRow({ row, index, nameSize }) {
  const isTop = index === 0;
  const pctColor = row.pct >= 50 ? C.brand : C.danger;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 18,
      background: isTop ? `${C.brand}12` : C.surface,
      border: `1px solid ${isTop ? `${C.brand}55` : C.border}`,
      borderRadius: 14, padding: '11px 22px',
    }}>
      <div style={{
        width: 40, flexShrink: 0, textAlign: 'center',
        fontFamily: fonts.display, fontWeight: 800, fontSize: 24,
        color: isTop ? C.brand : C.dim,
      }}>
        {index + 1}
      </div>
      <div style={{
        flex: 1, minWidth: 0, fontSize: nameSize, fontWeight: 600, color: C.white,
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
  const nameSize = fitSize(rows.map((r) => r.name), { base: 26, min: 18, fitChars: 20 });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rows.map((r) => (
        <div key={r.key ?? r.name} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 300, flexShrink: 0, fontSize: nameSize, color: C.soft,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {r.name}
          </div>
          <div style={{ flex: 1, minWidth: 0, height: 20, borderRadius: 10, background: C.surface2 }}>
            <div style={{
              width: `${(r.count / max) * 100}%`, height: '100%',
              borderRadius: 10, background: C.brand,
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
//   free    → sólo las básicas (torneos, partidos, jugadores, games, más veces campeón)
//   premium → básicas + avanzadas + ranking histórico (top 5) + campeones (top 3)
export default function CategoryStory({
  groupName,
  tournamentsCount = 0,
  totalMatches = 0,
  isPremium = false,
  champion = null,   // { label, count, tied }
  bestPlayer = null, // { name, wins }
  bestPair = null,   // { label, record, tied }
  ranking = [],      // [{ key, name, pj, pg, pct }] — ya recortado a 5
  rankingTitle = 'RANKING HISTÓRICO',
  champions = [],    // [{ name, count }] — ya recortado a 3
  playersCount = 0,
  totalGames = 0,
  playTime = null,   // { total, detail } ya formateados; null si no hay partidos cronometrados
  topClub = null,    // { name, jornadas }
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
          justifyContent: 'center', gap: 24,
        }}>
          {/* El wrapper flex evita que la tarjeta (flex:1) se estire a lo alto. */}
          {champion && (
            <div style={{ display: 'flex' }}>
              <HighlightCard
                big
                emoji="🏆"
                label={champion.tied ? 'MÁS VECES CAMPEONES' : 'MÁS VECES CAMPEÓN'}
                main={champion.label}
                mainSize={fitSize([champion.label], { base: 54, min: 30, fitChars: 20 })}
                sub={`${champion.count} ${champion.count === 1 ? 'torneo' : 'torneos'}`}
                accent={C.amber}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 24 }}>
            <NumberTile value={tournamentsCount} label="TORNEOS" accent={C.cyan} />
            <NumberTile value={totalMatches} label="PARTIDOS" accent={C.green} />
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <NumberTile value={playersCount} label="JUGADORES" accent={C.brand} />
            <NumberTile value={totalGames} label="GAMES" accent={C.amber} />
          </div>
          {(playTime || topClub) && (
            <div style={{ display: 'flex', gap: 24 }}>
              {playTime && (
                <StatTile
                  value={playTime.total}
                  valueSize={fitSize([playTime.total], { base: 66, min: 34, fitChars: 10 })}
                  label="EN CANCHA"
                  sub={playTime.detail}
                  accent={C.green}
                />
              )}
              {/* El club va en HighlightCard y no en StatTile: el nombre es
                  texto largo y acá puede partir en dos líneas en vez de cortarse. */}
              {topClub && (
                <HighlightCard
                  emoji="📍"
                  label="CLUB HABITUAL"
                  main={topClub.name}
                  mainSize={fitSize([topClub.name], { base: 40, min: 26, fitChars: 16 })}
                  sub={`${topClub.jornadas} ${topClub.jornadas === 1 ? 'jornada' : 'jornadas'}`}
                  accent={C.cyan}
                />
              )}
            </div>
          )}
        </div>
      </StoryFrame>
    );
  }

  // ── Premium: básicas + avanzadas + tarjetas + ranking + campeones.
  // Los totales van en el subtítulo en vez de en tarjetas propias: el layout ya
  // carga con el ranking y el gráfico, y así no queda todo apretado. ──────────
  const rankNameSize = fitSize(ranking.map((r) => r.name), { base: 26, min: 18, fitChars: 22 });

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
              mainSize={fitSize([champion.label], { base: 40, min: 24, fitChars: 26 })}
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
                label="MÁS GANADOR"
                main={bestPlayer.name}
                mainSize={fitSize([bestPlayer.name], { base: 40, min: 24, fitChars: 14 })}
                sub={`${bestPlayer.wins}V`}
                accent={C.brand}
              />
            )}
            {bestPair && (
              <HighlightCard
                emoji="🤝"
                label={bestPair.tied ? 'MÁS GANADORES · EMPATE' : 'PAREJA MÁS GANADORA'}
                main={bestPair.label}
                // El valor son dos nombres unidos con " & " (o varias parejas si
                // hay empate): el tamaño sale del largo real del texto.
                mainSize={fitSize([bestPair.label], { base: 40, min: 22, fitChars: 14 })}
                sub={bestPair.record ?? undefined}
                accent={C.green}
              />
            )}
          </div>
        )}

        {/* Tarjetas de volumen */}
        <div style={{ display: 'flex', gap: 20 }}>
          <StatTile value={playersCount} label="JUGADORES" accent={C.cyan} />
          <StatTile value={totalGames} label="GAMES" accent={C.amber} />
          {playTime
            ? <StatTile
                value={playTime.total}
                valueSize={fitSize([playTime.total], { base: 66, min: 34, fitChars: 6 })}
                label="EN CANCHA"
                sub={playTime.detail}
                accent={C.green}
              />
            : topClub
              ? <HighlightCard
                  emoji="📍"
                  label="CLUB HABITUAL"
                  main={topClub.name}
                  mainSize={fitSize([topClub.name], { base: 34, min: 20, fitChars: 10 })}
                  sub={`${topClub.jornadas} ${topClub.jornadas === 1 ? 'jornada' : 'jornadas'}`}
                  accent={C.brand}
                />
              : null}
        </div>

        {/* Ranking histórico */}
        {ranking.length > 0 && (
          <Section title={rankingTitle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ranking.map((r, i) => <RankRow key={r.key} row={r} index={i} nameSize={rankNameSize} />)}
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
