// Driver de Chrome por CDP, sin dependencias: no hay Playwright ni Puppeteer en
// el repo y no hace falta instalarlos. Node 22 trae WebSocket global.
//
//   import { launch } from './cdp.mjs';
//   const page = await launch('http://localhost:5173/u/alguien');
//   await page.waitFor('[aria-label="Compartir perfil"]');
//   await page.click('[aria-label="Compartir perfil"]');
//   await page.shot('modal.png');
//   await page.close();

import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = process.env.CHROME_PATH
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Abre `url` en un Chrome headless nuevo y devuelve los helpers de la página.
 * `size` por defecto es un mobile de 430x932: es donde se rompen los layouts.
 */
export async function launch(url, { size = '430,932', port = 9333, headless = true } = {}) {
  const chrome = spawn(CHROME, [
    ...(headless ? ['--headless=new'] : []),
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    // Perfil descartable: sin esto reusa el Chrome abierto del usuario y el
    // puerto de debug no queda expuesto.
    `--user-data-dir=${process.env.TEMP ?? '/tmp'}/cdp-profile-${Date.now()}`,
    `--window-size=${size}`,
    '--hide-scrollbars',
    url,
  ], { stdio: 'ignore' });

  let target;
  for (let i = 0; i < 40 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    } catch { /* Chrome todavía no abrió el puerto */ }
    if (!target) await sleep(250);
  }
  if (!target) { chrome.kill(); throw new Error('no encontré el target de Chrome'); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  const send = (method, params = {}) => {
    const msgId = ++id;
    ws.send(JSON.stringify({ id: msgId, method, params }));
    return new Promise((r) => pending.set(msgId, r));
  };

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    const details = res.result?.exceptionDetails;
    if (details) throw new Error(details.exception?.description ?? JSON.stringify(details));
    return res.result?.result?.value;
  }

  await send('Runtime.enable');
  await send('Page.enable');
  const errors = [];
  await send('Log.enable');
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      errors.push(msg.params.entry.text);
    }
  });

  return {
    evaluate,
    send,
    /** Espera a que el selector exista. La app pinta un loader primero. */
    async waitFor(selector, { timeout = 30000 } = {}) {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)) return true;
        await sleep(300);
      }
      throw new Error(`nunca apareció ${selector} — texto en pantalla: ${await this.text()}`);
    },
    click: (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`),
    /** Click por texto visible, para botones sin selector estable. */
    clickText: (text) => evaluate(
      `[...document.querySelectorAll('button')].find(b => b.innerText.includes(${JSON.stringify(text)})).click()`
    ),
    text: (limit = 400) => evaluate(`document.body.innerText.slice(0, ${limit})`),
    count: (selector) => evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`),
    async shot(file) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(file, Buffer.from(res.result.data, 'base64'));
      return file;
    },
    /** Errores de consola acumulados: una pantalla en blanco suele estar acá. */
    errors: () => errors,
    sleep,
    async close() { ws.close(); chrome.kill(); },
  };
}
