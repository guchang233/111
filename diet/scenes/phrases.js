// 五 · Who teaches you to starve: the slogans flood in, then get struck through one by one.
import { el, show, clamp, prog, ease, rng } from '/film/lib.js';
import { RED } from '../kit.js';

const SPOTS = [[160, 200, 92, 900], [1080, 170, 54, 500], [520, 330, 70, 900], [1240, 330, 46, 400], [130, 470, 48, 400], [760, 470, 110, 900],
               [1420, 500, 58, 700], [300, 640, 62, 700], [1030, 660, 44, 400], [150, 800, 40, 400], [700, 790, 86, 900], [1380, 790, 52, 500]];

export default {
  init(L, D) {
    const st = L.st, R = rng(11);
    st.items = D.timeline.phrases.map((p, i) => {
      const [x, y, s, w] = SPOTS[i];
      const e = el(L.ui, 'div', 'a', p, { left: `${x}px`, top: `${y}px`, fontFamily: 'var(--sans)', fontWeight: w, fontSize: `${s}px`, color: '#f2eee6', lineHeight: 1 });
      e._rot = (R() - 0.5) * 3;
      return e;
    });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, C = D.C, half = C.beat / 2;
    const out = 1 - prog(t, C.ph_out, C.ph_out + C.beat);
    st.items.forEach((e, i) => {
      const t0 = C.ph_in + i * half, a = clamp((t - t0) / 0.06);
      const k = ease.out(clamp((t - t0) / 0.18));
      e.style.transform = `scale(${(1.18 - 0.18 * k).toFixed(3)}) rotate(${e._rot.toFixed(2)}deg) translateY(${((1 - out) * -30).toFixed(1)}px)`;
      show(e, a * out * (t > C.ph_strike + i * C.beat / 4 ? 0.45 : 1));
      // the strike
      const ts = C.ph_strike + i * C.beat / 4, s = ease.out(clamp((t - ts) / 0.12));
      if (s > 0 && out > 0) {
        const x = e.offsetLeft, y = e.offsetTop + e.offsetHeight * 0.55, w = e.offsetWidth;
        ctx.strokeStyle = RED; ctx.globalAlpha = out; ctx.lineWidth = Math.max(4, e.offsetHeight * 0.09);
        ctx.beginPath(); ctx.moveTo(x - 14, y + 4); ctx.lineTo(x - 14 + (w + 28) * s, y - 4); ctx.stroke(); ctx.globalAlpha = 1;
      }
    });
  },
};
