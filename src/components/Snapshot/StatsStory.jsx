import StoryFrame, { HighlightCard } from './StoryFrame';
import { C } from './story-theme';

// Historia genérica de estadísticas (usada para "estadísticas del torneo" y
// "estadísticas de la categoría"). El call site arma `hero` e `items`.
export default function StatsStory({ eyebrow, title, subtitle, meta, headerRight, accent = C.brand, hero, items = [] }) {
  // Agrupa items en filas de a 2.
  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <StoryFrame eyebrow={eyebrow} title={title} subtitle={subtitle} meta={meta} headerRight={headerRight} accent={accent}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {hero && <HighlightCard {...hero} big />}
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 22 }}>
            {row.map((it, ci) => <HighlightCard key={ci} {...it} />)}
            {row.length === 1 && <div style={{ flex: 1 }} />}
          </div>
        ))}
      </div>
    </StoryFrame>
  );
}
