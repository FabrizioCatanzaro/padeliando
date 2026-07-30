import StoryFrame, { HighlightCard } from './StoryFrame';
import { C } from './story-theme';

// Historia genérica de estadísticas (usada para "estadísticas del torneo" y
// "estadísticas de la categoría"). El call site arma `hero` e `items`.
export default function StatsStory({ eyebrow, title, subtitle, meta, headerRight, accent = C.brand, hero, items = [] }) {
  // Grid de 2 columnas, no filas de flex: con una cantidad impar de tarjetas la
  // última quedaba más ancha, porque el div de relleno no reservaba el padding.
  const rows = Math.ceil(items.length / 2);

  // Con muchas tarjetas el alto justo alcanza: se aprieta el aire entre filas.
  const gap = rows >= 5 ? 16 : rows >= 4 ? 18 : 22;

  return (
    <StoryFrame eyebrow={eyebrow} title={title} subtitle={subtitle} meta={meta} headerRight={headerRight} accent={accent}>
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {hero && <HighlightCard {...hero} big />}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
          {items.map((it, i) => <HighlightCard key={i} {...it} />)}
        </div>
      </div>
    </StoryFrame>
  );
}
