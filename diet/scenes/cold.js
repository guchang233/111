// Cold open: a heartbeat; the scale goes down, the body-fat reading goes up.
import { el, show, text, clamp, prog, ease, rgba } from '/film/lib.js';
import { RED, IV, pulse } from '../kit.js';

export default {
  init(L, D) {
    const st = L.st, ui = L.ui;
    const block = (x, lab) => {
      const b = el(ui, 'div', 'a', '', { left: `${x}px`, top: '300px' });
      el(b, 'div', 'lab', lab);
      const n = el(b, 'div', 'num', '', { fontSize: '210px', lineHeight: 1, marginTop: '22px', color: IV });
      return { b, n };
    };
    st.w = block(250, '体重 · KG'); st.f = block(1070, '体脂率 · %');
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, C = D.C;
    pulse(ctx, t, C.beat, 0.6 + 0.6 * prog(t, C.scale_from, C.title));
    // the ECG before the numbers
    const ecg = 1 - prog(t, C.scale_from - 0.3, C.scale_from + 0.6);
    if (ecg > 0) {
      ctx.strokeStyle = rgba(RED, 0.85 * ecg); ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x <= 1920; x += 3) {
        const tt = t - (1920 - x) / 900, ph = ((tt % C.beat) + C.beat) % C.beat;
        const y = 540 - (tt < 0 ? 0 : 150 * Math.exp(-Math.pow((ph - 0.05) / 0.018, 2)) - 60 * Math.exp(-Math.pow((ph - 0.09) / 0.02, 2)) + 40 * Math.exp(-Math.pow((ph - 0.3) / 0.06, 2)));
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    const p = ease.io(prog(t, C.scale_from, C.scale_to));
    const vis = clamp((t - C.scale_from) / 0.3);
    // a digital scale settles: digits flicker while moving
    const flick = p > 0 && p < 1 ? Math.sin(t * 53) * 0.05 : 0;
    const w = 52.0 - 6.7 * p + flick, f = 24 + 24 * p - flick * 2;
    text(st.w.n, w.toFixed(1)); text(st.f.n, String(Math.round(f)));
    st.f.n.style.color = p > 0.35 ? RED : IV;
    show(st.w.b, vis); show(st.f.b, vis);
    // the two traces
    if (vis > 0) {
      const tr = (x0, y0, val, col) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const q = p * i / 120, x = x0 + 600 * q, y = y0 - val(q);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x0 + 600 * p, y0 - val(p), 5, 0, Math.PI * 2); ctx.fill();
      };
      tr(255, 640, (q) => -110 * q, rgba(IV, 0.9 * vis));
      tr(1075, 750, (q) => 110 * q, rgba(RED, vis));
    }
  },
};
