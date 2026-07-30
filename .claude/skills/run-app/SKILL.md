---
name: run-app
description: Lanza y maneja la app PADELEANDO en un navegador real — levanta la API Express y el dev server de Vite y dribla la UI con Chrome por CDP (clicks, texto, screenshots), sin Playwright ni Puppeteer. Usar cuando haya que ver un cambio funcionando de verdad, sacar una captura de pantalla o verificar un flujo end to end.
---

# Correr y manejar PADELEANDO

El repo **no tiene Playwright ni Puppeteer** y no hace falta instalarlos: `scripts/cdp.mjs` maneja el Chrome del sistema por CDP con el `WebSocket` global de Node 22.

## 1. Levantar el backend

El frontend sin API muestra "Failed to fetch" y ni siquiera pinta el perfil.

```bash
cd c:/Users/Fabry/Programacion/padeliando-api && (npm run dev > /tmp/api.log 2>&1 &) ; sleep 7; tail -2 /tmp/api.log
```

Esperar `Padeleando API en puerto 3001`. Usa el `.env` del repo, que apunta a la **base de Neon de producción** — sirve para leer datos reales; cuidado con lo que se escribe.

## 2. Levantar el frontend en el puerto 5173

**Tiene que ser 5173.** El `.env` de la API trae `CORS_ORIGIN=http://localhost:5173`; en cualquier otro puerto el navegador bloquea todas las llamadas y la pantalla queda vacía.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
```

- Responde `200` → ya hay un dev server (probablemente el del usuario). **Usarlo, no matarlo.**
- No responde → `(npm run dev > /tmp/vite.log 2>&1 &)` y confirmar en el log que tomó 5173 y no 5174.

`npm run preview` **no sirve** para esto: se levanta en 4173+ y CORS lo rechaza. Además `VITE_API_URL` se embebe en tiempo de build, así que un `dist/` viejo puede estar apuntando a otra API. Para medir rendimiento sí hay que usar `preview` (ver CLAUDE.md) y entonces conviene ajustar `CORS_ORIGIN` a mano.

## 3. Conseguir datos reales

Las rutas interesantes necesitan un registro que exista. Con el MCP de Neon (proyecto `weathered-morning-55905272`, sólo lectura):

```sql
SELECT u.username,
       (SELECT COUNT(*) FROM players p WHERE p.user_id = u.id) AS slots
FROM users u WHERE u.username <> 'cuenta_eliminada'
ORDER BY slots DESC LIMIT 5;
```

Perfiles públicos: `/u/:username`. Otras rutas sin sesión: `/`, `/view/:id`, `/cat/:groupId`.

**No hay forma automatizada de iniciar sesión**: el token va en una cookie httpOnly y no hay credenciales de prueba en el repo. Todo lo que dependa de `isOwnProfile`, de `can_manage` o del plan premium se verifica sólo con el usuario mirando. Decirlo en el reporte en vez de darlo por probado.

## 4. Manejar la UI

`scripts/cdp.mjs` devuelve los helpers; `scripts/smoke-profile-share.mjs` es un ejemplo completo y verificado (abre un perfil, abre el modal de compartir, revisa los tiles y saca dos capturas).

```js
import { launch } from './cdp.mjs';

const page = await launch('http://localhost:5173/u/ivanfigueroa');  // 430x932 por defecto
await page.waitFor('[aria-label="Compartir perfil"]');  // la app pinta un loader primero
await page.click('[aria-label="Compartir perfil"]');
await page.sleep(600);
console.log(await page.text());          // innerText del body
console.log(await page.count('button')); // cuántos matchean un selector
await page.shot('modal.png');            // PNG en el cwd
console.log(page.errors());              // errores de consola
await page.close();                      // cierra el WS y mata el Chrome
```

Otros helpers: `clickText('Crear imagen')` para botones sin selector estable, `evaluate('<js>')` para cualquier cosa que devuelva un valor serializable.

Correrlo desde el scratchpad para que las capturas no caigan en el repo:

```bash
cd <scratchpad> && node c:/Users/Fabry/Programacion/padeliando/.claude/skills/run-app/scripts/smoke-profile-share.mjs ivanfigueroa
```

**Mirar la captura con Read.** Un frame negro o vacío es un fallo de carga, no un éxito: contrastarlo siempre con `page.text()`.

Para elegir selectores: la app casi no tiene `data-testid`. Andan bien `aria-label`, el texto de los botones, y las clases propias de los modales (`.animate-sheet-up` es la hoja inferior de `ShareModal` y derivados).

## 5. Limpiar

Cerrar sólo lo que se levantó — si el 5173 ya estaba, es del usuario y se deja:

```powershell
foreach ($p in 3001,5174) { $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; if ($c) { Stop-Process -Id $c.OwningProcess -Force } }
```

`page.close()` ya mata su Chrome; si un script falló antes de llegar ahí, quedan procesos `chrome.exe` con `--user-data-dir` en TEMP.
