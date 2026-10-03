// Render HTML frames to 4K PNG stills with headless Chromium.
// Usage: node render/render-stills.mjs [render/frames/f1-title.html ...]
// A frame declares its size with <meta name="frame-size" content="1920x1080">
// and sets window.__ready = true once fonts are loaded and drawing is done.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
};

function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const scale = Number(process.env.SCALE || 2);
const args = process.argv.slice(2);
const frames = args.length
  ? args
  : fs.readdirSync(path.join(ROOT, 'render/frames')).filter((f) => f.endsWith('.html')).sort().map((f) => `render/frames/${f}`);
const outDir = path.join(ROOT, 'out/stills');
fs.mkdirSync(outDir, { recursive: true });

const server = await serve();
const port = server.address().port;
const browser = await chromium.launch();
for (const f of frames) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const m = html.match(/name="frame-size"\s+content="(\d+)x(\d+)"/);
  const [width, height] = m ? [Number(m[1]), Number(m[2])] : [1920, 1080];
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  page.on('console', (msg) => console.log(`  [${path.basename(f)}] ${msg.text()}`));
  page.on('pageerror', (err) => console.error(`  [${path.basename(f)}] ERROR ${err.message}`));
  await page.goto(`http://127.0.0.1:${port}/${f}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  const name = path.basename(f, '.html');
  const out = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width, height } });
  await page.close();
  console.log(`rendered ${name} -> ${path.relative(ROOT, out)} (${width * scale}x${height * scale})`);
}
await browser.close();
server.close();
