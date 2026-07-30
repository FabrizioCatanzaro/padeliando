// Vista previa Open Graph para los enlaces de torneo (/view/:id).
//
// WhatsApp, Telegram y compañía no ejecutan JavaScript: leen el HTML tal como
// sale del servidor. Como el sitio es una SPA, las etiquetas og: de index.html
// son las mismas para todas las rutas y cualquier torneo compartido mostraba
// el logo genérico. Esta función devuelve un HTML mínimo — sólo <head> — con
// las etiquetas resueltas para ese torneo.
//
// Sólo la ven los crawlers: vercel.json enruta acá únicamente cuando el
// user-agent es uno de ellos, así que las personas siguen recibiendo la SPA
// sin pagar este round-trip.

const API_BASE =
  process.env.API_BASE_URL ??
  process.env.VITE_API_URL ??
  'https://padeleando-api.onrender.com';

// El backend vive en el plan gratuito de Render y se duerme tras un rato de
// inactividad: despertarlo puede llevar decenas de segundos y los crawlers
// cortan mucho antes. Si no contesta a tiempo se sirve la tarjeta genérica,
// que es preferible a que el enlace no muestre nada.
const FETCH_TIMEOUT_MS = 4500;

const FORMAT_LABEL = { liga: 'Liga', americano: 'Americano' };

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Las fotos de club viven en Cloudinary: se recortan al 1.91:1 que piden las
// tarjetas en vez de mandar el original, que puede pesar varios MB y hacer que
// el crawler descarte la imagen.
function ogImage(url) {
  if (!url) return null;
  if (!url.includes('/upload/')) return url;
  return url.replace('/upload/', '/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/');
}

async function fetchTournament(id) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(`${API_BASE}/api/readonly/${encodeURIComponent(id)}`, {
      signal: ctrl.signal,
      headers: { accept: 'application/json' },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function buildCard(t, origin) {
  const fallbackImage = `${origin}/logo512.png`;

  if (!t) {
    return {
      title: 'Padeleando | Organizá tus torneos de pádel',
      description:
        'Armá torneos en formato Liga o Americano, cargá los resultados en vivo y compartí la tabla con un link.',
      image: fallbackImage,
      large: false,
    };
  }

  const title = [t.name, t.group_name].filter(Boolean).join(' · ');

  // La descripción se arma con lo que exista: formato, club, jugadores y
  // partidos. Un torneo recién creado no tiene ninguno de los últimos dos.
  const bits = [];
  if (FORMAT_LABEL[t.format]) bits.push(`Torneo ${FORMAT_LABEL[t.format]}`);
  if (t.club_name) bits.push(t.club_name);
  else if (t.club_location_name) bits.push(t.club_location_name);
  if (t.players?.length) bits.push(`${t.players.length} jugadores`);
  if (t.matches?.length) bits.push(`${t.matches.length} partidos`);

  const image = ogImage(t.club_photo_url);

  return {
    title: title || 'Padeleando',
    description: bits.length
      ? `${bits.join(' · ')}. Mirá la tabla y los resultados en vivo.`
      : 'Mirá la tabla de posiciones y los resultados en vivo.',
    image: image ?? fallbackImage,
    // Sin foto de club la imagen es el logo cuadrado: pedir la tarjeta grande
    // lo mostraría estirado o recortado.
    large: !!image,
  };
}

export default async function handler(req, res) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

  const proto = req.headers['x-forwarded-proto'] ?? 'https';
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const origin = `${proto}://${host}`;
  const pageUrl = `${origin}/view/${encodeURIComponent(id ?? '')}`;

  const card = buildCard(id ? await fetchTournament(id) : null, origin);

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${esc(card.title)}</title>
<meta name="description" content="${esc(card.description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Padeleando" />
<meta property="og:locale" content="es_AR" />
<meta property="og:url" content="${esc(pageUrl)}" />
<meta property="og:title" content="${esc(card.title)}" />
<meta property="og:description" content="${esc(card.description)}" />
<meta property="og:image" content="${esc(card.image)}" />
<meta property="og:image:width" content="${card.large ? 1200 : 512}" />
<meta property="og:image:height" content="${card.large ? 630 : 512}" />
<meta property="og:image:alt" content="${esc(card.title)}" />
<meta name="twitter:card" content="${card.large ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${esc(card.title)}" />
<meta name="twitter:description" content="${esc(card.description)}" />
<meta name="twitter:image" content="${esc(card.image)}" />
<link rel="canonical" href="${esc(pageUrl)}" />
</head>
<body><a href="${esc(pageUrl)}">${esc(card.title)}</a></body>
</html>`;

  // Se cachea en el CDN para que compartir el mismo torneo muchas veces no
  // despierte al backend en cada reenvío; stale-while-revalidate deja que el
  // primer visitante tras el vencimiento reciba la copia vieja al instante.
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', 'public, s-maxage=300, stale-while-revalidate=3600');
  res.status(200).send(html);
}
