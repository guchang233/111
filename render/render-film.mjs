// Render the film: parallel headless pages → JPEG frames piped into ffmpeg → chunks → concat + audio + grain.
// node render/render-film.mjs [--from 0] [--to <dur>] [--scale 1] [--workers 4] [--out out/film/draft.mp4] [--crf 18] [--grain 3]
//   --pure: the 纯享版 (no words on screen; its own timeline and audio master)
//   --mux-only: skip rendering, re-encode the chunks already in <out>.parts (e.g. to change grain or crf)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { serve, ROOT } from './server.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const scale = Number(arg('scale', 1)), workers = Number(arg('workers', 4)), crf = arg('crf', '18');
const out = path.resolve(ROOT, arg('out', 'out/film/draft.mp4'));
const tmp = out.replace(/\.mp4$/, '') + '.parts';
fs.mkdirSync(tmp, { recursive: true });
const pure = process.argv.includes('--pure');
const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, `film/data/timeline${pure ? '_pure' : ''}.json`)));
const fps = timeline.fps, dur = Number(arg('to', timeline.duration)), from = Number(arg('from', 0));
const f0 = Math.round(from * fps), f1 = Math.round(dur * fps);
const total = f1 - f0;
const muxOnly = process.argv.includes('--mux-only');
const server = await serve();
const url = `http://127.0.0.1:${server.address().port}/film/index.html${pure ? '?pure' : ''}`;
const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit'] });
const t0 = Date.now();
let done = 0;

async function work(w, a, b) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  page.on('pageerror', (e) => console.error(`[w${w}] page error`, e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
  const file = path.join(tmp, `part${String(w).padStart(2, '0')}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '10', '-pix_fmt', 'yuv420p', '-r', String(fps), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = a; f < b; f++) {
    await page.evaluate((t) => window.renderFrame(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    done++;
    if (done % 150 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`  ${done}/${total} frames · ${(done / el).toFixed(1)} fps · eta ${((total - done) / (done / el) / 60).toFixed(1)} min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
  return file;
}

if (!muxOnly) {
  const per = Math.ceil(total / workers);
  const jobs = [];
  for (let w = 0; w < workers; w++) {
    const a = f0 + w * per, b = Math.min(f1, a + per);
    if (a < b) jobs.push(work(w, a, b));
  }
  const parts = await Promise.all(jobs);
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map((p) => `file '${p}'`).join('\n'));
}
await browser.close(); server.close();
const audio = path.join(ROOT, `out/audio/master${pure ? '_pure' : ''}.wav`);
// light static dither on luma: breaks banding in the dark gradients and survives B站 transcoding.
// The pattern is the same every frame, so it costs bits only in keyframes (a temporal grain at 4K
// made the file ~10× larger and the encode ~4× slower).
const g = Number(arg('grain', scale >= 2 ? 4 : 3));
const grain = g > 0 ? `noise=c0s=${g}:c0f=u` : 'null';
const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'),
  '-ss', String(from), '-t', String(dur - from), '-i', audio,
  '-map', '0:v', '-map', '1:a', '-vf', `${grain},format=yuv420p`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high', '-tune', 'grain', '-movflags', '+faststart',
  '-c:a', 'aac', '-b:a', '320k', '-shortest', out];
await new Promise((r, j) => spawn('ffmpeg', args, { stdio: 'inherit' }).on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
console.log(`done: ${path.relative(ROOT, out)} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
