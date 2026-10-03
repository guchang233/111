// LAYER 04 · 音高 — the dramatic centre.
// callback (EVA's falling fifths) → the twelve 律 as a star of fifths that will not close →
// the parity proof → Zhu Zaiyu types the twelfth root of two → the circle closes → what it cost.
import { C, el, show, html, text, env, clamp, rgba, prog, ease, typeLine } from '../lib.js';

const INK = '#171615';
const LV = ['黄钟', '大吕', '太簇', '夹钟', '姑洗', '仲吕', '蕤宾', '林钟', '夷则', '南吕', '无射', '应钟'];   // chromatic, C at top
const CX = 700, CY = 586, R = 270;
const ang = (semi) => -Math.PI / 2 + (semi / 12) * Math.PI * 2;
const at = (semi, r = R) => [CX + r * Math.cos(ang(semi)), CY + r * Math.sin(ang(semi))];
const PYTH = 701.955 / 100;            // a pure fifth, in semitones

function lissajous(ctx, cx, cy, r, phase, alpha, color) {
  // the fifth F–C on an oscilloscope: x = F (2 cycles), y = C (3 cycles); phase drift = the beat
  ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = 1.4; ctx.beginPath();
  const N = 900;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI * 2;
    const px = cx + Math.sin(2 * th) * r, py = cy + Math.sin(3 * th + phase) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
}

export default {
  bg: 'paper', paper: true,
  glyphs: LV.join('') + '×→÷²³⁷¹²√…·0123456789%',
  init(L, D) {
    const st = L.st, ui = L.ui, Cq = D.C;
    st.kick = el(ui, 'div', 'a kicker', 'LAYER 04 <em>/</em> 06 &nbsp;·&nbsp; PITCH', { left: '120px', top: '104px' });
    st.title = el(ui, 'div', 'a h-title', '音高', { left: '120px', top: '140px' });
    // a · callback
    st.ask = el(ui, 'div', 'a', '还记得开头那四个和弦吗？', { left: 0, right: 0, textAlign: 'center', top: '330px', fontFamily: 'var(--serif-cn)', fontSize: '32px', letterSpacing: '0.08em' });
    st.cb = ['Cm', 'Fm', 'B♭', 'E♭'].map((n, i) => el(ui, 'div', 'a', n.replace('♭', '<span style="font-family:var(--serif-cn);font-weight:300;font-size:0.5em;vertical-align:0.62em">♭</span>'),
      { left: `${430 + i * 300}px`, top: '470px', width: '240px', textAlign: 'center', fontFamily: 'var(--serif-en)', fontWeight: 500, fontSize: '120px', lineHeight: 1 }));
    st.cbArrows = [0, 1, 2].map((i) => el(ui, 'div', 'a', '<div style="font-size:30px">→</div><div class="mono" style="font-size:13px;letter-spacing:0.14em;color:var(--mark);margin-top:6px">↓ 五度</div>',
      { left: `${670 + i * 300}px`, top: '505px', width: '60px', textAlign: 'center', fontFamily: 'var(--serif-en)' }));
    st.cbCap = el(ui, 'div', 'a', '每一步，根音都走一个纯五度：频率之比 <span class="mono">3 : 2</span>。', { left: 0, right: 0, textAlign: 'center', top: '700px', fontFamily: 'var(--serif-cn)', fontSize: '26px', letterSpacing: '0.06em', color: 'rgba(23,22,21,0.7)' });
    // b · the star of fifths
    st.lv = LV.map((name, i) => { const [x, y] = at(i, R + 50); return el(ui, 'div', 'a', name, { left: `${x - 40}px`, top: `${y - 16}px`, width: '80px', textAlign: 'center', fontFamily: 'var(--serif-cn)', fontSize: '24px', fontWeight: 500, letterSpacing: '0.04em' }); });
    st.stepK = el(ui, 'div', 'a mono', '', { left: '120px', top: '880px', fontSize: '14px', letterSpacing: '0.16em', color: 'rgba(23,22,21,0.55)', whiteSpace: 'nowrap' });
    st.side = el(ui, 'div', 'a', '', { left: '1180px', top: '330px', width: '640px' });
    st.side.innerHTML = `
      <div class="kicker" style="color:rgba(23,22,21,0.55)">三分损益 · 每次乘以 3/2</div>
      <div style="font-family:var(--serif-cn);font-size:30px;margin-top:22px;line-height:1.6">从黄钟出发，连走十二个五度，<br>本该回到黄钟。</div>
      <div class="mono s1" style="font-size:40px;margin-top:40px">(3/2)<sup style="font-size:0.55em">12</sup> = 129.746…</div>
      <div class="mono s2" style="font-size:40px;margin-top:14px">&nbsp;&nbsp;&nbsp;2<sup style="font-size:0.55em">7</sup> = 128</div>
      <div class="s3" style="font-family:var(--serif-cn);font-size:30px;margin-top:34px;color:var(--mark)">差了 <span class="mono">1.36%</span>。黄钟，回不去了。</div>
      <div class="s4 kicker" style="margin-top:16px;color:rgba(23,22,21,0.5)">毕达哥拉斯音差 · 古人称"黄钟不能还原"</div>`;
    st.s = ['.s1', '.s2', '.s3', '.s4'].map((q) => st.side.querySelector(q));
    st.zoom = el(ui, 'div', 'a mono', '详图 A · ×6 &nbsp; 差 23.46 音分', { fontSize: '12.5px', letterSpacing: '0.14em', color: C.mark, whiteSpace: 'nowrap' });
    // c · proof
    st.proof = el(ui, 'div', 'a', '', { left: '1180px', top: '330px', width: '660px' });
    st.proof.innerHTML = `
      <div class="p0" style="font-family:var(--serif-cn);font-size:36px">为什么？</div>
      <div class="p1" style="font-family:var(--serif-cn);font-size:28px;margin-top:40px"><span class="mono">3 × 3 × 3 × …</span>　永远是奇数</div>
      <div class="p2" style="font-family:var(--serif-cn);font-size:28px;margin-top:18px"><span class="mono">2 × 2 × 2 × …</span>　永远是偶数</div>
      <div class="p3" style="font-family:var(--serif-cn);font-size:28px;margin-top:40px;color:rgba(23,22,21,0.7)">奇数，永远不等于偶数。</div>
      <div class="p4" style="font-family:var(--serif-cn);font-weight:700;font-size:46px;margin-top:40px">完美的音律，不存在。</div>`;
    st.p = ['.p0', '.p1', '.p2', '.p3', '.p4'].map((q) => st.proof.querySelector(q));
    // d · Zhu Zaiyu's letter
    st.letter = el(ui, 'div', 'a', '', { left: '300px', top: '300px', color: '#1d1b19' });
    const lineStyle = [{ fontFamily: 'var(--serif-cn)', fontWeight: 500, fontSize: '30px', letterSpacing: '0.06em', lineHeight: 1.95 },
                       { fontFamily: 'var(--type)', fontSize: '74px', lineHeight: 1.25, margin: '22px 0 6px -4px' },
                       { fontFamily: 'var(--serif-cn)', fontWeight: 500, fontSize: '30px', letterSpacing: '0.06em', lineHeight: 1.95 }];
    st.typed = Cq.typing.map((ln, i) => el(st.letter, 'div', '', '', { whiteSpace: 'nowrap', ...lineStyle[i] }));
    st.vert = el(ui, 'div', 'a vert', '朱载堉 · 律学新说<br><small style="font-size:18px;letter-spacing:0.4em;color:rgba(23,22,21,0.5);margin-top:26px;display:inline-block">明 · 万历十二年</small>',
      { right: '150px', top: '300px', fontWeight: 500, fontSize: '26px', letterSpacing: '0.5em', color: 'rgba(23,22,21,0.78)' });
    // e · closing
    st.closeCap = el(ui, 'div', 'a', '', { left: '1180px', top: '420px', width: '640px', fontFamily: 'var(--serif-cn)', fontSize: '30px', lineHeight: 1.6 });
    st.closeCap.innerHTML = '每一步乘以 <span class="mono">1.0595</span>，<br>十二步之后，<span style="color:var(--violet)">正好回到黄钟</span>。';
    // f · the cost
    st.costL = el(ui, 'div', 'a', '<div class="kicker">JUST · 纯律五度</div><div class="mono" style="font-size:34px;margin-top:12px">2 : 3</div><div style="font-family:var(--serif-cn);font-size:20px;margin-top:10px;color:rgba(23,22,21,0.65)">图形静止</div>',
      { left: '440px', top: '820px', width: '360px', textAlign: 'center' });
    st.costR = el(ui, 'div', 'a', '<div class="kicker">EQUAL · 平均律五度</div><div class="mono" style="font-size:34px;margin-top:12px">2 : 2.997</div><div style="font-family:var(--serif-cn);font-size:20px;margin-top:10px;color:rgba(23,22,21,0.65)">图形一直在转，每 1.7 秒一圈</div>',
      { left: '1120px', top: '820px', width: '360px', textAlign: 'center' });
    st.costTop = el(ui, 'div', 'a', 'F 大三和弦里的五度：F – C', { left: 0, right: 0, textAlign: 'center', top: '236px', fontFamily: 'var(--serif-cn)', fontSize: '26px', letterSpacing: '0.1em' });
    st.costCap = el(ui, 'div', 'a', '五度窄了 <span class="mono">0.11%</span>，三度宽了 <span class="mono">0.79%</span>。你听过的每一个和弦，都差了这一点点。',
      { left: 0, right: 0, textAlign: 'center', top: '960px', fontFamily: 'var(--serif-cn)', fontSize: '24px', letterSpacing: '0.06em' });
    // g · sign-off
    st.sign = el(ui, 'div', 'a', '', { left: '300px', top: '480px', fontFamily: 'var(--type)', fontSize: '64px', color: '#1d1b19', whiteSpace: 'nowrap' });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, Cq = D.C;
    const A = Cq.l4_callback, B = Cq.l4_spiral, G = Cq.l4_gap, P = Cq.l4_proof, Z = Cq.l4_zhu, CL = Cq.l4_close, CO = Cq.l4_cost, SG = Cq.l4_sign;
    show(st.title, env(t, Cq.l4_in, Z - 0.2, 0.6, 0.5) + env(t, CL, SG, 0.5, 0.5));
    // ---- a · callback --------------------------------------------------------
    const aVis = env(t, A - 0.2, B, 0.4, 0.5);
    show(st.ask, aVis);
    const half = D.eva_phrase.bar / 2;
    st.cb.forEach((e, i) => show(e, aVis * ease.out(clamp((t - (A + i * half)) / 0.25))));
    st.cbArrows.forEach((e, i) => show(e, aVis * ease.out(clamp((t - (A + (i + 1) * half - 0.15)) / 0.25))));
    show(st.cbCap, aVis * clamp((t - (A + 3.1)) / 0.4));
    // ---- b/c/e · the circle ----------------------------------------------------
    const circVis = env(t, B - 0.3, Z + 0.3, 0.5, 0.5) * (1 - 0.82 * prog(t, P, P + 0.6)) + env(t, CL - 0.2, CO + 0.4, 0.4, 0.5);
    if (circVis > 0.001) {
      ctx.globalAlpha = clamp(circVis);
      const closing = t >= CL - 0.2;
      ctx.strokeStyle = rgba(INK, 0.5); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 12; i++) {                         // equal-tempered positions: hairline ticks
        const [x1, y1] = at(i, R - 9), [x2, y2] = at(i, R + 9);
        ctx.strokeStyle = rgba(INK, 0.55); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      // pythagorean points: k fifths up, each a little sharp of the tick
      const steps = closing ? Cq.l4_steps.map((_, k) => CL + 0.3 + k * 0.17) : Cq.l4_steps;
      const pos = (k) => closing ? (7 * k) % 12 : ((PYTH * k) % 12);
      const lineCol = closing ? C.violet : INK;
      for (let k = 1; k <= 12; k++) {
        const ts = steps[k];
        if (t < ts - 0.3) break;
        const f = ease.out(clamp((t - (ts - 0.3)) / 0.3));
        const [x0, y0] = at(pos(k - 1)), [x1, y1] = at(pos(k));
        ctx.strokeStyle = rgba(lineCol, k === 12 && !closing ? 1 : 0.75); ctx.lineWidth = k === 12 ? 1.6 : 1.1;
        if (k === 12 && !closing) ctx.strokeStyle = C.mark;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f); ctx.stroke();
      }
      for (let k = 0; k <= 12; k++) {
        if (t < steps[k] - 0.05) break;
        const [x, y] = at(pos(k));
        ctx.fillStyle = k === 12 && !closing ? C.mark : (closing ? C.violet : INK);
        ctx.beginPath(); ctx.arc(x, y, k === 0 || k === 12 ? 5 : 3.6, 0, Math.PI * 2); ctx.fill();
      }
      // names appear as the walk visits them (all of them while closing)
      LV.forEach((_, i) => {
        const k = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5].indexOf(i);   // step at which semitone i is reached
        const on = closing || t >= Cq.l4_steps[k] - 0.05;
        show(st.lv[i], clamp(circVis) * (on ? 1 : 0.18));
      });
      // detail view of the miss
      const gz = clamp((t - G) / 0.5) * (closing ? 0 : 1);
      if (gz > 0) {
        const [gx, gy] = at(0), zx = CX - 420, zy = CY - 214, zr = 70, mag = 6;
        ctx.strokeStyle = rgba(C.mark, gz); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(gx, gy, 16, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(gx - 14, gy - 4); ctx.lineTo(zx + zr * 0.95, zy + zr * 0.3); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = rgba('#f4f0e8', gz); ctx.beginPath(); ctx.arc(zx, zy, zr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = rgba(C.mark, gz); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(zx, zy, zr, 0, Math.PI * 2); ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.arc(zx, zy, zr - 1, 0, Math.PI * 2); ctx.clip();
        const [ex, ey] = at(PYTH * 12 % 12);
        const map = (x, y) => [zx + (x - gx) * mag, zy + (y - gy) * mag + 40];
        ctx.strokeStyle = rgba(INK, gz * 0.6); ctx.lineWidth = 1;
        ctx.beginPath(); for (let a = -0.2; a <= 0.2; a += 0.01) { const [x, y] = map(CX + R * Math.cos(-Math.PI / 2 + a), CY + R * Math.sin(-Math.PI / 2 + a)); a <= -0.2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
        const [p0x, p0y] = map(gx, gy), [p1x, p1y] = map(ex, ey);
        ctx.fillStyle = rgba(INK, gz); ctx.beginPath(); ctx.arc(p0x, p0y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba(C.mark, gz); ctx.beginPath(); ctx.arc(p1x, p1y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = rgba(C.mark, gz); ctx.beginPath(); ctx.moveTo(p0x, p0y + 14); ctx.lineTo(p1x, p1y + 14); ctx.stroke();
        ctx.restore();
        st.zoom.style.left = (zx - zr) + 'px'; st.zoom.style.top = (zy - zr - 28) + 'px';
      }
      show(st.zoom, gz * env(t, G, P, 0.3, 0.4));
      ctx.globalAlpha = 1;
    } else {
      st.lv.forEach((e) => show(e, 0)); show(st.zoom, 0);
    }
    const sideVis = env(t, B + 0.2, P, 0.5, 0.4);
    show(st.side, sideVis);
    st.s.forEach((e, i) => show(e, clamp((t - (G + [0.0, 0.5, 1.4, 2.2][i])) / 0.35)));
    text(st.stepK, t >= B && t < P ? `STEP ${Math.min(12, Cq.l4_steps.filter((x) => x <= t).length - 1).toString().padStart(2, '0')} / 12 · 三分损益 · ×3/2` : '');
    show(st.stepK, env(t, B + 0.6, P, 0.3, 0.3));
    // ---- c · proof ---------------------------------------------------------------
    show(st.proof, env(t, P, Z, 0.3, 0.5));
    st.p.forEach((e, i) => show(e, clamp((t - (P + [0.2, 1.1, 2.0, 3.0, 3.9][i])) / 0.35)));
    // ---- d · the letter ----------------------------------------------------------
    const lVis = env(t, Z - 0.2, CL, 0.4, 0.5);
    show(st.letter, lVis); show(st.vert, env(t, Z + 1.0, CL, 0.8, 0.5));
    Cq.typing.forEach((ln, i) => typeLine(st.typed[i], ln, t, { caret: i === 1 }));
    // ---- e · the circle closes -----------------------------------------------------
    show(st.closeCap, env(t, CL + 1.2, CO, 0.5, 0.4));
    // ---- f · the cost ----------------------------------------------------------------
    const cVis = env(t, CO, SG, 0.5, 0.5);
    if (cVis > 0) {
      ctx.globalAlpha = cVis;
      const f3 = 174.6141, beat = Math.abs(2 * f3 * Math.pow(2, 7 / 12) - 3 * f3);   // 0.59 Hz, real time
      const te = Math.max(0, t - Cq.l4_et);
      const lOn = 0.3 + 0.7 * env(t, Cq.l4_just, Cq.l4_et - 0.1, 0.3, 0.3);
      const rOn = 0.3 + 0.7 * env(t, Cq.l4_et, SG, 0.3, 0.4);
      ctx.strokeStyle = rgba(INK, 0.12); ctx.lineWidth = 1;
      for (const [x, y] of [[620, 560], [1300, 560]]) { ctx.strokeRect(x - 200, y - 200, 400, 400); }
      // phase 0 gives the full 2:3 knot (at π/4 the curve folds back onto itself)
      lissajous(ctx, 620, 560, 190, 0, 0.9 * lOn, INK);
      lissajous(ctx, 1300, 560, 190, 2 * Math.PI * beat * te, 0.9 * rOn, C.mark);
      ctx.globalAlpha = 1;
    }
    show(st.costTop, cVis); show(st.costL, cVis); show(st.costR, cVis);
    show(st.costCap, env(t, Cq.l4_et + 1.2, SG, 0.5, 0.5));
    // ---- g · sign-off --------------------------------------------------------------------
    show(st.sign, env(t, SG, L.spec.end, 0.3, 0.6));
    typeLine(st.sign, Cq.typing_sign, t, { caret: true });
  },
};
