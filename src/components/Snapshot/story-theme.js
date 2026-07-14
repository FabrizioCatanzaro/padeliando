// Constantes de las historias exportables (dimensiones, paleta, fuentes).
// Separadas de los componentes para no romper el fast-refresh de Vite.

export const STORY_W = 1080;
export const STORY_H = 1920;

// Paleta (espejo del tema oscuro de index.css).
export const C = {
  bg:      '#000000',
  surface: '#0d0d0d',
  surface2:'#141414',
  border:  '#222222',
  borderS: '#2e2e2e',
  brand:   '#e8f04a',
  cyan:    '#4af0c8',
  green:   '#4af07a',
  danger:  '#f04a4a',
  amber:   '#fbbf24',
  white:   '#ffffff',
  soft:    '#aaaaaa',
  secondary:'#888888',
  dim:     '#666666',
  muted:   '#555555',
  faint:   '#444444',
};

export const fonts = {
  display: "'Unbounded', sans-serif",
  sans:    "'Albert Sans', sans-serif",
};
