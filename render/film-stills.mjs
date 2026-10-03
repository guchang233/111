// Render single film frames for review: node render/film-stills.mjs 5.0 16.2 [--scale 1] [--only scene1,scene2]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { serve, ROOT } from './server.mjs';

const args = process.argv.slice(2);
const scale = args.includes('--scale') ? Number(args[args.indexOf('--scale') + 1]) : 1;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : '';
const times = args.filter((a, i) => !a.startsWith('--') && !['--scale', '--only'].includes(args[i - 1])).map(Number);
const out = path.join(ROOT, 'out/film-stills');
fs.mkdirSync(out, { recursive: true });
const server = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
page.on('console', (m) => console.log('  [page]', m.text()));
let failed = null;
page.on('pageerror', (e) => { console.error('  [page error]', e.message); failed = e.message; });
await page.goto(`http://127.0.0.1:${server.address().port}/film/index.html${only ? '?only=' + only : ''}`);
for (let i = 0; i < 240 && !failed; i++) {
  if (await page.evaluate(() => window.__ready === true)) break;
  await new Promise((r) => setTimeout(r, 250));
}
if (failed || !(await page.evaluate(() => window.__ready === true))) { console.error('page not ready:', failed); await browser.close(); server.close(); process.exit(1); }
for (const t of times) {
  await page.evaluate((t) => window.renderFrame(t), t);
  const f = path.join(out, `t${t.toFixed(2).padStart(7, '0')}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 90 });
  console.log('frame', t, '->', path.relative(ROOT, f));
}
await browser.close();
server.close();
