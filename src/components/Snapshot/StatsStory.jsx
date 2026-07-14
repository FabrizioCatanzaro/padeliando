import StoryFrame from './StoryFrame';
import { C, fonts } from './story-theme';

// Tarjeta de highlight (etiqueta + valor principal + subtítulo).
function HighlightCard({ label, main, sub, accent = C.brand, emoji, big }) {
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
        fontSize: big ? 54 : 40, lineHeight: 1.05, wordBreak: 'break-word',
      }}>
        {main}
      </div>
      {sub && <div style={{ fontSize: 24, color: C.secondary, marginTop: 10 }}>{sub}</div>}
    </div>
  );
}

// Historia genérica de estadísticas (usada para "estadísticas del torneo" y
// "estadísticas de la categoría"). El call site arma `hero` e `items`.
export default function StatsStory({ eyebrow, title, subtitle, accent = C.brand, hero, items = [] }) {
  // Agrupa items en filas de a 2.
  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <StoryFrame eyebrow={eyebrow} title={title} subtitle={subtitle} accent={accent}>
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
