// III · Frieren, the B-minor song, as her favourite spell: a field of flowers under the meteor
// shower. Every melody note grows a stem as tall as its pitch and opens a pale-blue flower as wide as
// its touch; every inner-voice note is a meteor; the bass is the grass.
import { C, el, show, env, clamp, rgba, N, ease, rng, PURE } from '../lib.js';

const GOLD = '#cdb986', IV = '#ece7de', MOON = '#d6e1f0', BLUE = '#a9bfdc', GROUND = 902;
const MA = 0.42, MDX = -Math.cos(MA), MDY = Math.sin(MA);    // meteors fall to the lower left
const X0 = 130, X1 = 1790;

export default {
  bg: 'night',
  init(L, D) {
    const st = L.st, dat = D.fri_d;
    st.dur = dat.dur;
    st.notes = dat.notes.map(N);
    const R = rng(1311);
    for (const n of st.notes) { n.jx = (R() - 0.5) * 10; n.ph = R() * Math.PI * 2; n.rot = R() * Math.PI; n.my = R(); }
    st.stars = Array.from({ length: 240 }, () => ({ x: R() * 1920, y: 40 + Math.pow(R(), 1.3) * 640, r: 0.4 + R() * R() * 1.1, a: 0.12 + R() * 0.4, ph: R() * 6.28 }));
    if (!PURE) el(L.ui, 'div', 'a kicker', 'III &nbsp;·&nbsp; 葬送的芙莉莲 · 组曲 &nbsp;·&nbsp; 钢琴改编 ANIMENZ', { left: '120px', top: '104px' });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st;
    const u = t - D.C.fri_d;
    const xOf = (s) => X0 + (s / st.dur) * (X1 - X0);
    // sky
    for (const S of st.stars) {
      ctx.fillStyle = rgba(MOON, S.a * (0.75 + 0.25 * Math.sin(u * 0.8 + S.ph)));
      ctx.beginPath(); ctx.arc(S.x, S.y, S.r, 0, Math.PI * 2); ctx.fill();
    }
    // ground
    const gr = ctx.createLinearGradient(0, GROUND - 30, 0, GROUND + 60);
    gr.addColorStop(0, rgba(GOLD, 0)); gr.addColorStop(0.4, rgba(GOLD, 0.06)); gr.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = gr; ctx.fillRect(0, GROUND - 30, 1920, 90);
    ctx.strokeStyle = rgba(GOLD, 0.14); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(X0 - 40, GROUND); ctx.lineTo(X1 + 40, GROUND); ctx.stroke();
    for (const n of st.notes) {
      if (n.s > u) break;
      const age = u - n.s, x = xOf(n.s) + n.jx, v = n.v / 127;
      if (n.tr === 1) {                                   // grass
        const g = ease.out(clamp(age / 0.4)), h = (16 + 46 * v) * g;
        const lean = Math.sin(u * 0.9 + x * 0.02 + n.ph) * 4 + (n.jx * 0.6);
        ctx.strokeStyle = rgba(GOLD, 0.32 + 0.2 * Math.exp(-age / 0.5)); ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x + lean * 0.3, GROUND - h * 0.6, x + lean, GROUND - h); ctx.stroke();
      } else if (n.role !== 'm') {                       // a meteor
        const life = 1.5, k = age / life;
        if (k >= 1) continue;
        const len = 150 + 230 * v, x0 = x + 220 + n.jx * 18, y0 = 70 + n.my * 240 + (84 - n.p) * 3;
        const hd = len * ease.out(clamp(k / 0.55)), tl = len * clamp((k - 0.25) / 0.75) * 1.0;
        const hx = x0 + MDX * hd, hy = y0 + MDY * hd, tx = x0 + MDX * Math.min(hd, tl), ty = y0 + MDY * Math.min(hd, tl);
        const tail = Math.max(0, hd - Math.min(hd, tl));
        const a = (0.35 + 0.65 * v) * (1 - clamp((k - 0.5) / 0.5));
        const sx = hx - MDX * Math.min(tail, 140), sy = hy - MDY * Math.min(tail, 140);
        const g = ctx.createLinearGradient(sx, sy, hx, hy);
        g.addColorStop(0, rgba(MOON, 0)); g.addColorStop(1, rgba(MOON, 0.9 * a));
        ctx.strokeStyle = g; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(Math.abs(hx - tx) > 1 ? sx : hx, Math.abs(hx - tx) > 1 ? sy : hy); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.fillStyle = rgba('#ffffff', 0.9 * a * (1 - clamp((k - 0.35) / 0.3)));
        ctx.beginPath(); ctx.arc(hx, hy, 1.3, 0, Math.PI * 2); ctx.fill();
      } else {                                           // a flower
        const H = 90 + (n.p - 58) * 13;
        const grow = ease.out(clamp(age / 0.45));
        const sway = Math.sin(u * 0.85 + x * 0.011 + n.ph) * 0.03 * (H / 300);
        const hx = x + Math.sin(sway) * H * grow, hy = GROUND - Math.cos(sway) * H * grow;
        ctx.strokeStyle = rgba(IV, 0.36); ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x + (hx - x) * 0.2, GROUND - H * grow * 0.55, hx, hy); ctx.stroke();
        const bloom = ease.out(clamp((age - 0.25) / 0.7));
        if (bloom <= 0) continue;
        const r = (8 + 13 * v) * bloom;
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(n.rot + u * 0.05);
        for (let k = 0; k < 5; k++) {
          ctx.save(); ctx.rotate((k / 5) * Math.PI * 2); ctx.translate(0, -r * 0.55);
          ctx.beginPath(); ctx.ellipse(0, 0, r * 0.32, r * 0.58, 0, 0, Math.PI * 2);
          ctx.fillStyle = rgba(BLUE, 0.08 + 0.14 * Math.exp(-age / 0.6)); ctx.fill();
          ctx.strokeStyle = rgba(MOON, 0.88); ctx.lineWidth = 0.9; ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = rgba(GOLD, 0.95); ctx.beginPath(); ctx.arc(0, 0, Math.max(1.2, r * 0.17), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (age < 0.9) {
          const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 40);
          g.addColorStop(0, rgba(GOLD, 0.35 * Math.exp(-age / 0.3))); g.addColorStop(1, rgba(GOLD, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 40, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  },
};
