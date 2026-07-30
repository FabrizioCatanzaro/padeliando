// Ejemplo real: abre un perfil público y maneja el modal de compartir.
// Uso: node smoke-profile-share.mjs <username> [baseUrl]
import { launch } from './cdp.mjs';

const username = process.argv[2] ?? 'ivanfigueroa';
const base     = process.argv[3] ?? 'http://localhost:5173';

const page = await launch(`${base}/u/${username}`);

await page.waitFor('[aria-label="Compartir perfil"]');
console.log('perfil cargado:', await page.text(120));
console.log('botones de compartir (debe ser 1):', await page.count('[aria-label="Compartir perfil"]'));

await page.click('[aria-label="Compartir perfil"]');
await page.sleep(600);

const modal = await page.evaluate(`(() => {
  const m = [...document.querySelectorAll('div')].find(d => String(d.className).includes('animate-sheet-up'));
  if (!m) return null;
  return {
    titulo: m.querySelector('span')?.innerText ?? null,
    tiles: [...m.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean),
    preview: m.innerText.includes('VISTA PREVIA'),
  };
})()`);
console.log('modal:', JSON.stringify(modal));
console.log('captura:', await page.shot('share-modal.png'));

// El tile de imagen cierra la hoja y abre el SnapshotModal.
if (modal?.tiles?.some((t) => t.includes('Crear imagen'))) {
  await page.clickText('Crear imagen');
  await page.sleep(1500);
  console.log('historia abierta:', await page.evaluate(`document.body.innerText.includes('Compartir historia')`));
  console.log('hoja cerrada:', await page.evaluate(`!document.querySelector('.animate-sheet-up')`));
  console.log('captura:', await page.shot('share-story.png'));
}

const errs = page.errors();
if (errs.length) console.log('errores de consola:', errs.slice(0, 5));

await page.close();
process.exit(0);
