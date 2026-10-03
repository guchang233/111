// LAYER 03 · 和弦: the Sincerely climax. Each chord is a triangle on the twelve-tone clock.
import { C, el, show, html, text, env, clamp, rgba, N, prog, ease } from '../lib.js';

const CX = 700, CY = 566, R = 300;
const PC = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const pt = (pc, r = R) => { const a = -Math.PI / 2 + (pc / 12) * Math.PI * 2; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; };

export default {
  bg: 'dark',
  glyphs: PC.join('') + '0123456789:–',
  init(L, D) {
    const st = L.st, ui = L.ui;
    st.chords = D.sincerely.chords;
    st.notes = D.sincerely.notes.map(N);
    el(ui, 'div', 'a kicker', 'LAYER 03 <em style="color:var(--violet)">/</em> 06 &nbsp;·&nbsp; CHORDS', { left: '120px', top: '104px' });
    el(ui, 'div', 'a h-title', '和弦', { left: '120px', top: '140px', color: '#eee9e0' });
    el(ui, 'div', 'a kicker', 'SONG 02 &nbsp;·&nbsp; SINCERELY &nbsp;·&nbsp; 紫罗兰永恒花园 OP &nbsp;·&nbsp; 钢琴改编 ANIMENZ', { left: '120px', bottom: '84px' });
    st.name = el(ui, 'div', 'a', '', { left: '1200px', top: '300px', fontFamily: 'var(--serif-en)', fontWeight: 500, fontSize: '170px', lineHeight: 1, color: '#f2eee6', whiteSpace: 'nowrap' });
    st.roman = el(ui, 'div', 'a', '', { left: '1210px', top: '490px', fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: '52px', color: C.violetHi });
    st.ratio = el(ui, 'div', 'a mono', '', { left: '1212px', top: '590px', fontSize: '40px', letterSpacing: '0.04em', color: '#eee9e0' });
    st.ratioK = el(ui, 'div', 'a kicker', '', { left: '1214px', top: '650px' });
    st.prog = el(ui, 'div', 'a', '', { left: '1212px', top: '760px', fontFamily: 'var(--serif-en)', fontSize: '34px', letterSpacing: '0.06em', whiteSpace: 'nowrap' });
    st.progK = el(ui, 'div', 'a', '这四个和弦有个名字：<b style="font-weight:500;color:#eee9e0">小室进行</b>。动画歌曲最爱用它。', {
      left: '1214px', top: '820px', fontFamily: 'var(--serif-cn)', fontSize: '19px', letterSpacing: '0.04em', color: 'rgba(236,231,222,0.62)', whiteSpace: 'nowrap' });
    st.mirror = el(ui, 'div', 'a', '大三和弦与小三和弦，形状互为<b style="font-weight:500;color:#eee9e0">镜像</b>。', {
      left: '1214px', top: '820px', fontFamily: 'var(--serif-cn)', fontSize: '19px', letterSpacing: '0.04em', color: 'rgba(236,231,222,0.62)', whiteSpace: 'nowrap' });
    st.romans = ['vi', 'IV', 'V', 'I'];
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st;
    const u = t - D.C.sin_start;
    // the clock
    ctx.strokeStyle = rgba(C.ivory, 0.18); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(CX, CY, R + 46, 0, Math.PI * 2); ctx.strokeStyle = rgba(C.ivory, 0.07); ctx.stroke();
    // sounding pitch classes glow on the rim
    const glow = new Array(12).fill(0);
    for (const n of st.notes) {
      if (n.s > u) break;
      const age = u - n.s;
      if (age < n.d + 0.5) glow[n.p % 12] = Math.max(glow[n.p % 12], (n.v / 127) * Math.exp(-age / 0.6));
    }
    ctx.font = '500 26px "Cormorant Garamond"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let pc = 0; pc < 12; pc++) {
      const [x, y] = pt(pc), [lx, ly] = pt(pc, R + 46);
      ctx.fillStyle = rgba(C.ivory, 0.35 + 0.65 * glow[pc]);
      ctx.beginPath(); ctx.arc(x, y, 3 + 5 * glow[pc], 0, Math.PI * 2); ctx.fill();
      if (glow[pc] > 0.05) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 30); g.addColorStop(0, rgba(C.ivoryHi, 0.4 * glow[pc])); g.addColorStop(1, rgba(C.ivoryHi, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = rgba(C.ivory, 0.55); ctx.fillText(PC[pc], lx, ly);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // chord triangles: the trail, then the current one
    let cur = null;
    for (const c of st.chords) if (u >= c.t) cur = c;
    for (const c of st.chords) {
      if (u < c.t || c === cur) continue;
      const age = u - (c.t + c.d);
      const a = 0.16 * Math.exp(-Math.max(0, age) / 6);
      ctx.strokeStyle = rgba(C.violetHi, a); ctx.lineWidth = 1;
      ctx.beginPath(); c.pcs.forEach((p, i) => { const [x, y] = pt(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke();
    }
    if (cur) {
      const k = ease.out(clamp((u - cur.t) / 0.18));
      const pts = cur.pcs.map((p) => pt(p));
      const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
      ctx.beginPath(); pts.forEach(([x, y], i) => { const X = cx + (x - cx) * k, Y = cy + (y - cy) * k; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath();
      ctx.fillStyle = rgba(C.violet, 0.16); ctx.fill();
      ctx.strokeStyle = C.violetHi; ctx.lineWidth = 2; ctx.stroke();
      const [rx, ry] = pt(cur.root);
      ctx.fillStyle = C.violetHi; ctx.beginPath(); ctx.arc(rx, ry, 7, 0, Math.PI * 2); ctx.fill();
      html(st.name, cur.name.replace('♭', '<span style="font-family:var(--serif-cn);font-weight:300;font-size:0.5em;vertical-align:0.62em;margin-left:0.04em">♭</span>'));
      text(st.roman, cur.roman);
      text(st.ratio, cur.q === 'min' ? '10 : 12 : 15' : '4 : 5 : 6');
      text(st.ratioK, cur.q === 'min' ? 'MINOR TRIAD · 小三和弦的频率比' : 'MAJOR TRIAD · 大三和弦的频率比');
      const base = cur.roman.replace('⁶', '');
      html(st.prog, st.romans.map((r) => `<span style="color:${r === base ? '#f2eee6' : 'rgba(236,231,222,0.28)'}">${r}</span>`).join('<span style="color:rgba(236,231,222,0.2)"> – </span>'));
    }
    const vis = env(t, D.C.sin_start + 0.3, D.C.l3_out + 0.6, 0.4, 0.5);
    for (const e of [st.name, st.roman, st.ratio, st.ratioK, st.prog]) show(e, vis);
    show(st.progK, env(u, 13.6, 27.6, 0.6, 0.6));
    show(st.mirror, env(u, 1.9, 7.0, 0.6, 0.6));
  },
};
