import albertUrl from '../../assets/fonts/albert-sans-latin.woff2?url';
import unboundedUrl from '../../assets/fonts/unbounded-latin.woff2?url';

// Las historias se capturan dentro de un SVG foreignObject, donde sólo existen
// las fuentes embebidas en el propio CSS: las de la página no cuentan. Por eso
// html-to-image recorre las hojas de estilo y descarga cada webfont, pero la de
// Google Fonts es cross-origin (no puede leer sus cssRules) y de ahí salen los
// PNG con la tipografía del sistema aunque el preview se vea bien.
//
// Acá se arma ese CSS a mano con los dos woff2 latinos servidos por nosotros:
// dos descargas del mismo origen en vez de una hoja ajena más ~7 subsets.
let cached = null;

async function toDataUri(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo leer la fuente (${res.status})`);
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = '';
  // En trozos: un spread de 50k bytes desborda la pila de argumentos en móvil.
  for (let i = 0; i < buf.length; i += 8192) {
    bin += String.fromCharCode(...buf.subarray(i, i + 8192));
  }
  return `data:font/woff2;base64,${btoa(bin)}`;
}

function face(family, dataUri) {
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:400 900;font-display:block;src:url(${dataUri}) format('woff2');}`;
}

/** CSS con las fuentes de la historia embebidas. Se descarga una sola vez. */
export async function snapshotFontCSS() {
  if (cached) return cached;
  const [albert, unbounded] = await Promise.all([toDataUri(albertUrl), toDataUri(unboundedUrl)]);
  cached = face('Albert Sans', albert) + face('Unbounded', unbounded);
  return cached;
}
