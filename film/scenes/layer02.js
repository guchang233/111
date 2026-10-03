// LAYER 02 · 节奏: the arranger slows time down. The tempo map of the EVA intro, drawn as it plays.
import { C, el, show, text, env, clamp, rgba, N, prog, ease } from '../lib.js';

const INK = '#171615';
const X0 = 300, X1 = 1640, Y0 = 820, Y1 = 330;      // chart box: x = source time, y = BPM

export default {
  bg: 'paper', paper: true,
  init(L, D) {
    const st = L.st, ui = L.ui, Cq = D.C;
    st.src = Cq.l2_src;                                      // [7.975, 18.568] in EVA seconds
    st.tempos = D.eva_intro.tempos;
    st.notes = D.eva_intro.notes.map(N).filter((n) => n.s >= st.src[0] - 1e-3 && n.s < st.src[1]);
    el(ui, 'div', 'a kicker', 'LAYER 02 <em>/</em> 06 &nbsp;·&nbsp; TIME', { left: '120px', top: '104px' });
    el(ui, 'div', 'a h-title', '节奏', { left: '120px', top: '140px' });
    el(ui, 'div', 'a h-sub', '改编者在这里，把时间放慢了。', { left: '120px', top: '230px' });
    st.big = el(ui, 'div', 'a', '', { right: '120px', top: '96px', textAlign: 'right' });
    st.bigNum = el(st.big, 'div', 'mono', '158', { fontSize: '96px', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.01em' });
    el(st.big, 'div', 'kicker', 'BPM · 每分钟拍数', { marginTop: '10px' });
    st.beat = el(ui, 'div', 'a mono', '', { right: '120px', top: '236px', fontSize: '15px', letterSpacing: '0.12em', color: 'rgba(23,22,21,0.6)', textAlign: 'right' });
    st.note1 = el(ui, 'div', 'a', '渐慢 rit.：4.2 秒里，从 158 拍降到 98 拍', { fontFamily: 'var(--serif-cn)', fontSize: '17px', color: C.mark, letterSpacing: '0.04em', whiteSpace: 'nowrap' });
    st.note2 = el(ui, 'div', 'a', '停住 4.9 秒，然后以 129 拍进入主旋律', { fontFamily: 'var(--serif-cn)', fontSize: '17px', color: C.mark, letterSpacing: '0.04em', whiteSpace: 'nowrap' });
    el(ui, 'div', 'a kicker', 'SONG 01 &nbsp;·&nbsp; 残酷天使的行动纲领 &nbsp;·&nbsp; 开头 0:08–0:19', { left: '120px', bottom: '84px' });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, Cq = D.C;
    const [s0, s1] = st.src;
    const src = s0 + (t - Cq.l2_audio);                    // current EVA time being heard
    const xOf = (s) => X0 + ((s - s0) / (s1 + 0.6 - s0)) * (X1 - X0);
    const yOf = (b) => Y0 - ((b - 80) / (170 - 80)) * (Y0 - Y1);
    const appear = ease.out(prog(t, Cq.l2_in + 0.2, Cq.l2_in + 1.0));
    // axes and grid
    ctx.globalAlpha = appear;
    ctx.strokeStyle = rgba(INK, 0.8); ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(X0, Y1 - 20); ctx.lineTo(X0, Y0); ctx.lineTo(X1 + 20, Y0); ctx.stroke();
    ctx.font = '400 13px "IBM Plex Mono"'; ctx.fillStyle = rgba(INK, 0.55);
    for (const b of [90, 120, 150]) {
      ctx.strokeStyle = rgba(INK, 0.12); ctx.lineWidth = 0.8; ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(X0, yOf(b)); ctx.lineTo(X1, yOf(b)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillText(String(b), X0 - 44, yOf(b) + 4);
    }
    for (let s = Math.ceil(s0); s <= s1; s++) {
      ctx.strokeStyle = rgba(INK, 0.6); ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(xOf(s), Y0); ctx.lineTo(xOf(s), Y0 + 7); ctx.stroke();
      ctx.fillText(`${s}s`, xOf(s) - 8, Y0 + 26);
    }
    ctx.fillText('BPM', X0 - 44, Y1 - 28);
    // note onsets as ticks along the floor: density falls as time slows
    for (const n of st.notes) {
      if (n.s > src) continue;
      const x = xOf(n.s), a = 0.35 + 0.65 * Math.exp(-(src - n.s) / 0.6);
      ctx.strokeStyle = rgba(INK, a); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, Y0 - 4); ctx.lineTo(x, Y0 - 4 - 10 - (n.p - 40) * 0.35); ctx.stroke();
    }
    // tempo step line up to "now"
    const pts = [];
    let cur = 158;
    for (let i = 0; i < st.tempos.length; i++) {
      const [ts, b] = st.tempos[i];
      if (ts < s0) { cur = b; continue; }
      pts.push([ts, b]);
    }
    let bNow = 158, prevB = 158;
    for (const [ts, b] of st.tempos) if (ts <= src) bNow = b;
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath();
    let x = xOf(s0), y = yOf(cur);
    ctx.moveTo(x, y);
    let lastB = cur;
    for (const [ts, b] of pts) {
      if (ts > src) break;
      ctx.lineTo(xOf(ts), yOf(lastB)); ctx.lineTo(xOf(ts), yOf(b)); lastB = b;
    }
    ctx.lineTo(xOf(Math.min(src, s1 + 0.6)), yOf(lastB)); ctx.stroke();
    // step labels
    ctx.font = '500 15px "IBM Plex Mono"';
    lastB = cur;
    for (const [ts, b] of pts) {
      if (ts > src) break;
      const a = clamp((src - ts) / 0.2);
      ctx.fillStyle = rgba(b === 129 ? C.mark : INK, a);
      ctx.beginPath(); ctx.arc(xOf(ts), yOf(b), 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(String(b), xOf(ts) + 8, yOf(b) - 10);
      lastB = b;
    }
    if (src >= s0) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(xOf(Math.min(src, s1 + 0.6)), yOf(lastB), 5, 0, Math.PI * 2); ctx.fill(); }
    // red-pencil brackets
    const rit0 = Cq.eva_rit, rit1 = Cq.eva_pause;
    const ab = clamp((src - rit1) / 0.4);
    if (ab > 0) {
      ctx.strokeStyle = rgba(C.mark, ab); ctx.lineWidth = 1.1;
      const yy = yOf(166);
      ctx.beginPath(); ctx.moveTo(xOf(rit0), yy + 8); ctx.lineTo(xOf(rit0), yy); ctx.lineTo(xOf(rit1), yy); ctx.lineTo(xOf(rit1), yy + 8); ctx.stroke();
      st.note1.style.left = xOf(rit0) + 'px'; st.note1.style.top = (yy - 34) + 'px';
    }
    show(st.note1, ab * appear);
    const ab2 = clamp((src - (Cq.phrase - 0.6)) / 0.4);
    if (ab2 > 0) {
      ctx.strokeStyle = rgba(C.mark, ab2); ctx.lineWidth = 1.1;
      const yy = yOf(108);
      ctx.beginPath(); ctx.moveTo(xOf(rit1), yy - 8); ctx.lineTo(xOf(rit1), yy); ctx.lineTo(xOf(Cq.phrase), yy); ctx.lineTo(xOf(Cq.phrase), yy - 8); ctx.stroke();
      st.note2.style.left = (xOf(rit1) + 4) + 'px'; st.note2.style.top = (yy + 12) + 'px';
    }
    show(st.note2, ab2 * appear);
    ctx.globalAlpha = 1;
    text(st.bigNum, String(Math.round(bNow)));
    text(st.beat, `每拍 = 60 ÷ ${Math.round(bNow)} = ${(60 / bNow).toFixed(3)} 秒`);
  },
};
